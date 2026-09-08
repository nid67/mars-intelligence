"""
GIS & GeoJSON Layer Service.
Constructs RFC 7946 compliant GeoJSON layers for map visualization:
- Spill polygon & centroid
- Probable origin region
- Backward & forward Lagrangian drift particles
- AIS vessel tracks & candidate attribution markers
- Environmental wind & current vectors
- Coastline & port infrastructure
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from backend.app.core.exceptions import InvestigationNotFoundException
from backend.app.models.investigation import Investigation
from backend.app.models.spill import SpillDetection
from backend.app.models.drift import DriftRun
from backend.app.models.assessment import CandidateAssessment
from backend.app.models.vessel import Vessel
from backend.app.models.ais import AISPosition
from backend.app.models.environment import EnvironmentalObservation
from backend.app.providers.demo.geography import DemoGeographyProvider


class GISService:
    @staticmethod
    def get_spill_layer(investigation_id: str, db: Session) -> Dict[str, Any]:
        spills = db.query(SpillDetection).filter(SpillDetection.investigation_id == investigation_id).all()
        features = []
        for s in spills:
            # 1. Polygon Feature
            features.append({
                "type": "Feature",
                "id": f"spill-poly-{s.id}",
                "geometry": s.polygon_geometry,
                "properties": {
                    "layer": "potential_oil_spill",
                    "id": str(s.id),
                    "status": s.status,
                    "confidence": s.confidence,
                    "look_alike_risk": s.look_alike_risk,
                    "estimated_area_sqkm": s.estimated_area_sqkm,
                    "perimeter_km": s.perimeter_km,
                    "orientation_deg": s.orientation_deg,
                    "elongation": s.elongation,
                    "observation_time": s.observation_timestamp.isoformat()
                }
            })
            # 2. Centroid Marker Feature
            features.append({
                "type": "Feature",
                "id": f"spill-centroid-{s.id}",
                "geometry": {
                    "type": "Point",
                    "coordinates": s.centroid
                },
                "properties": {
                    "layer": "spill_centroid",
                    "id": str(s.id),
                    "area_sqkm": s.estimated_area_sqkm,
                    "confidence": s.confidence
                }
            })
        return {"type": "FeatureCollection", "features": features}

    @staticmethod
    def get_origin_layer(investigation_id: str, db: Session) -> Dict[str, Any]:
        drift_runs = db.query(DriftRun).filter(
            DriftRun.investigation_id == investigation_id,
            DriftRun.direction == "BACKWARD"
        ).all()
        features = []
        for dr in drift_runs:
            if dr.result_polygon:
                features.append({
                    "type": "Feature",
                    "id": f"origin-poly-{dr.id}",
                    "geometry": dr.result_polygon,
                    "properties": {
                        "layer": "probable_origin_region",
                        "drift_run_id": str(dr.id),
                        "release_window_start": dr.release_window_start.isoformat() if dr.release_window_start else None,
                        "release_window_end": dr.release_window_end.isoformat() if dr.release_window_end else None,
                        "uncertainty_radius_km": dr.uncertainty_radius_km,
                        "particles": dr.num_particles
                    }
                })
        return {"type": "FeatureCollection", "features": features}

    @staticmethod
    def get_drift_layer(investigation_id: str, db: Session) -> Dict[str, Any]:
        runs = db.query(DriftRun).filter(DriftRun.investigation_id == investigation_id).all()
        features = []
        for r in runs:
            if r.direction == "BACKWARD" and r.particle_trajectories:
                # Sample trajectories as lines
                for t_snap in r.particle_trajectories:
                    pts = t_snap.get("sample_points", [])
                    if len(pts) >= 2:
                        features.append({
                            "type": "Feature",
                            "geometry": {"type": "MultiPoint", "coordinates": pts},
                            "properties": {
                                "layer": "backward_particles",
                                "elapsed_hours": t_snap.get("elapsed_hours_backward"),
                                "dispersion_km": t_snap.get("dispersion_radius_km")
                            }
                        })
            elif r.direction == "FORWARD" and r.result_polygon:
                features.append({
                    "type": "Feature",
                    "geometry": r.result_polygon,
                    "properties": {
                        "layer": "forward_spread_forecast",
                        "duration_hours": r.duration_hours,
                        "coastal_impact_proximity_km": r.coastal_impact_proximity_km
                    }
                })
        return {"type": "FeatureCollection", "features": features}

    @staticmethod
    def get_vessels_layer(investigation_id: str, db: Session) -> Dict[str, Any]:
        assessments = db.query(CandidateAssessment).filter(
            CandidateAssessment.investigation_id == investigation_id
        ).all()
        features = []

        for ass in assessments:
            vessel = db.query(Vessel).filter(Vessel.id == ass.vessel_id).first()
            if not vessel:
                continue

            positions = db.query(AISPosition).filter(
                AISPosition.vessel_id == vessel.id
            ).order_by(AISPosition.timestamp).all()

            if len(positions) >= 2:
                coords = [[p.longitude, p.latitude] for p in positions]
                # Track LineString
                features.append({
                    "type": "Feature",
                    "id": f"track-{vessel.mmsi}",
                    "geometry": {"type": "LineString", "coordinates": coords},
                    "properties": {
                        "layer": "vessel_track",
                        "mmsi": vessel.mmsi,
                        "vessel_name": vessel.name,
                        "vessel_type": vessel.vessel_type,
                        "attribution_score": ass.attribution_score,
                        "candidate_rank": ass.candidate_rank,
                        "priority": ass.investigation_priority
                    }
                })

                # Latest Position Marker
                latest = positions[-1]
                features.append({
                    "type": "Feature",
                    "id": f"pos-{vessel.mmsi}",
                    "geometry": {"type": "Point", "coordinates": [latest.longitude, latest.latitude]},
                    "properties": {
                        "layer": "candidate_vessel_marker",
                        "mmsi": vessel.mmsi,
                        "name": vessel.name,
                        "vessel_type": vessel.vessel_type,
                        "attribution_score": ass.attribution_score,
                        "rank": ass.candidate_rank,
                        "priority": ass.investigation_priority,
                        "speed_knots": latest.speed_knots,
                        "course_deg": latest.course_deg
                    }
                })

        return {"type": "FeatureCollection", "features": features}

    @staticmethod
    def get_environment_layer(investigation_id: str, db: Session) -> Dict[str, Any]:
        env_obs = db.query(EnvironmentalObservation).filter(
            EnvironmentalObservation.investigation_id == investigation_id
        ).all()
        features = []
        for e in env_obs:
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [e.longitude, e.latitude]},
                "properties": {
                    "layer": "environmental_forcing",
                    "u_current_mps": e.u_current,
                    "v_current_mps": e.v_current,
                    "u_wind_mps": e.u_wind,
                    "v_wind_mps": e.v_wind,
                    "source": e.source,
                    "timestamp": e.timestamp.isoformat()
                }
            })
        return {"type": "FeatureCollection", "features": features}

    @staticmethod
    def get_combined_map(investigation_id: str, db: Session) -> Dict[str, Any]:
        inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if not inv:
            raise InvestigationNotFoundException(investigation_id)

        geo_provider = DemoGeographyProvider()
        coastline = geo_provider.get_coastline(inv.bbox)

        layers = {
            "spill": GISService.get_spill_layer(investigation_id, db),
            "origin": GISService.get_origin_layer(investigation_id, db),
            "drift": GISService.get_drift_layer(investigation_id, db),
            "vessels": GISService.get_vessels_layer(investigation_id, db),
            "environment": GISService.get_environment_layer(investigation_id, db),
            "coastline": {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": coastline.geometry_geojson,
                    "properties": {
                        "layer": "coastal_reference",
                        "nearest_port": coastline.nearest_port_name,
                        "port_distance_km": coastline.port_proximity_km
                    }
                }]
            }
        }

        return {
            "investigation_id": str(inv.id),
            "region": inv.region,
            "observation_time": inv.observation_time.isoformat(),
            "bbox": inv.bbox,
            "layers": layers
        }
