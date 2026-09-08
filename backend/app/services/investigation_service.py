"""
Investigation Pipeline Service.
Executes the complete 21-step forensic investigation workflow:
Observation -> Detection -> Characterization -> Backtracking -> Origin Estimation ->
Forward Forecast -> AIS Reconstruction -> Candidate Filtering -> Attribution -> Evidence -> Uncertainty -> Persistence.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.core.exceptions import InvestigationNotFoundException
from backend.app.models.investigation import Investigation
from backend.app.models.satellite import SatelliteObservation
from backend.app.models.spill import SpillDetection
from backend.app.models.vessel import Vessel
from backend.app.models.ais import AISPosition
from backend.app.models.environment import EnvironmentalObservation
from backend.app.models.drift import DriftRun
from backend.app.models.assessment import CandidateAssessment
from backend.app.models.evidence import Evidence
from backend.app.models.model_run import ModelRun
from backend.app.models.datasource import DataSource

from backend.app.providers.factory import ProviderFactory
from backend.app.providers.internal_models import AISRecord
from backend.app.engines.detector import SpillDetector
from backend.app.engines.drift import LagrangianDriftEngine
from backend.app.engines.ais_reconstruction import AISTrajectoryReconstructor
from backend.app.engines.candidate_filtering import CandidateFilteringEngine
from backend.app.engines.attribution import AttributionEngine
from backend.app.engines.evidence import EvidenceEngine
from backend.app.engines.uncertainty import UncertaintyEngine


class InvestigationPipelineService:
    @staticmethod
    def run_pipeline(investigation_id: str, db: Session) -> Dict[str, Any]:
        """Executes the complete 21-step investigation pipeline."""
        logger.info(f"Initiating 21-step MARS forensic pipeline for investigation ID: {investigation_id}")

        # ----------------------------------------------------------------------
        # Step 1: Load investigation
        # ----------------------------------------------------------------------
        inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if not inv:
            raise InvestigationNotFoundException(investigation_id)

        inv.status = "PROCESSING"
        db.commit()

        # ----------------------------------------------------------------------
        # Step 2: Resolve data mode
        # ----------------------------------------------------------------------
        data_mode = inv.data_mode or settings.DATA_MODE.value
        logger.info(f"Resolved execution data mode: {data_mode}")

        # ----------------------------------------------------------------------
        # Step 3: Resolve AOI & observation time
        # ----------------------------------------------------------------------
        bbox = inv.bbox
        obs_time = inv.observation_time
        start_time = obs_time - timedelta(hours=24)
        end_time = obs_time + timedelta(hours=6)

        # ----------------------------------------------------------------------
        # Step 4: Retrieve satellite observation
        # ----------------------------------------------------------------------
        sat_provider = ProviderFactory.get_satellite_provider(data_mode)
        scenes = sat_provider.search_scenes(bbox, start_time, obs_time)
        selected_scene = scenes[0]

        # ----------------------------------------------------------------------
        # Step 5: Preprocess SAR & Extract Raster Subset
        # ----------------------------------------------------------------------
        raster = sat_provider.get_subset(selected_scene, bbox, resolution_m=10.0)

        # ----------------------------------------------------------------------
        # Step 6, 7 & 8: Run ML / CFAR detector, generate candidate spill, characterize
        # ----------------------------------------------------------------------
        detector = SpillDetector()
        characterization, model_meta = detector.detect_and_characterize(
            raster=raster,
            wind_speed_mps=5.0,
            coastal_distance_km=20.0
        )

        # ----------------------------------------------------------------------
        # Step 9: Retrieve environmental data
        # ----------------------------------------------------------------------
        env_provider = ProviderFactory.get_environmental_provider(data_mode)
        env_field = env_provider.get_environmental_field(bbox, obs_time)

        # ----------------------------------------------------------------------
        # Step 10, 11 & 12: Run backward drift, estimate origin region & release window
        # ----------------------------------------------------------------------
        drift_engine = LagrangianDriftEngine(
            num_particles=settings.DRIFT_DEFAULT_PARTICLES,
            windage_factor=settings.DRIFT_DEFAULT_WINDAGE,
            diffusion_coeff=settings.DRIFT_DEFAULT_DIFFUSION
        )
        backward_result = drift_engine.run_backward_drift(
            spill_centroid=characterization["centroid"],
            observation_time=obs_time,
            env_field=env_field,
            backward_hours=12.0
        )

        # ----------------------------------------------------------------------
        # Step 13: Run forward forecast drift (+6h, +12h, +24h)
        # ----------------------------------------------------------------------
        forward_result = drift_engine.run_forward_forecast(
            spill_centroid=characterization["centroid"],
            observation_time=obs_time,
            env_field=env_field,
            forecast_hours=24.0,
            coastal_distance_km=25.0
        )

        # ----------------------------------------------------------------------
        # Step 14: Retrieve and reconstruct AIS vessel tracks
        # ----------------------------------------------------------------------
        # Check if vessels are already in database, or query provider
        db_vessels = db.query(Vessel).all()
        vessel_evaluations = []

        for v in db_vessels:
            # Query positions in window
            positions = db.query(AISPosition).filter(
                AISPosition.vessel_id == v.id,
                AISPosition.timestamp >= start_time,
                AISPosition.timestamp <= end_time
            ).order_by(AISPosition.timestamp).all()

            ais_records = [
                AISRecord(
                    mmsi=p.mmsi,
                    imo=v.imo,
                    vessel_name=v.name,
                    vessel_type=v.vessel_type,
                    flag=v.flag,
                    timestamp=p.timestamp,
                    latitude=p.latitude,
                    longitude=p.longitude,
                    speed_knots=p.speed_knots or 12.0,
                    course_deg=p.course_deg or 0.0,
                    heading_deg=p.heading_deg or 0.0,
                    navigation_status=p.navigation_status or "UNDERWAY",
                    source=p.source or "AIS",
                    quality_score=p.quality_score or 1.0,
                    gap_duration_hours=p.gap_duration_hours or 0.0
                )
                for p in positions
            ]

            reconstruction = AISTrajectoryReconstructor.reconstruct_and_analyze(
                records=ais_records,
                origin_polygon_geojson=backward_result["probable_origin_polygon"],
                release_window_start=backward_result["release_window_start"],
                release_window_end=backward_result["release_window_end"]
            )

            vessel_evaluations.append({
                "vessel": {
                    "id": str(v.id),
                    "mmsi": v.mmsi,
                    "name": v.name,
                    "vessel_type": v.vessel_type,
                    "flag": v.flag
                },
                "db_vessel": v,
                "analysis": reconstruction
            })

        # ----------------------------------------------------------------------
        # Step 15: Filter candidate vessels
        # ----------------------------------------------------------------------
        qualified_candidates = CandidateFilteringEngine.filter_candidates(
            vessels_with_analysis=vessel_evaluations,
            max_origin_distance_km=35.0
        )

        # ----------------------------------------------------------------------
        # Step 16: Score candidates (Attribution Engine)
        # ----------------------------------------------------------------------
        scored_candidates = []
        for cand in qualified_candidates:
            score_data = AttributionEngine.score_candidate(
                analysis=cand["analysis"],
                vessel=cand["vessel"],
                weights=settings.ATTRIBUTION_WEIGHTS
            )
            cand["score_data"] = score_data
            scored_candidates.append(cand)

        # Sort by attribution score descending
        scored_candidates.sort(key=lambda x: x["score_data"]["attribution_score"], reverse=True)
        for rank_idx, cand in enumerate(scored_candidates):
            cand["score_data"]["candidate_rank"] = rank_idx + 1

        # ----------------------------------------------------------------------
        # Step 17 & 18: Generate supporting and contradicting evidence
        # ----------------------------------------------------------------------
        all_evidence_records = []
        for cand in scored_candidates:
            # We will save candidate assessment model and generate evidence
            pass

        # ----------------------------------------------------------------------
        # Step 19: Calculate structured uncertainty
        # ----------------------------------------------------------------------
        score_values = [c["score_data"]["attribution_score"] for c in scored_candidates]
        structured_uncertainty = UncertaintyEngine.calculate_structured_uncertainty(
            spill_data=characterization,
            drift_data=backward_result,
            vessel_analyses=[c["analysis"] for c in scored_candidates],
            candidate_scores=score_values,
            data_mode=data_mode
        )

        # ----------------------------------------------------------------------
        # Step 20: Persist all outputs to Database
        # ----------------------------------------------------------------------
        # A. Clear any previous run artifacts for this investigation
        db.query(CandidateAssessment).filter(CandidateAssessment.investigation_id == inv.id).delete()
        db.query(DriftRun).filter(DriftRun.investigation_id == inv.id).delete()
        db.query(SpillDetection).filter(SpillDetection.investigation_id == inv.id).delete()
        db.query(ModelRun).filter(ModelRun.investigation_id == inv.id).delete()
        db.flush()

        # B. Persist Model Run
        model_run_record = ModelRun(
            investigation_id=inv.id,
            model_name=model_meta["model_name"],
            model_version=model_meta["model_version"],
            model_mode=model_meta["model_mode"],
            task_type=model_meta["task_type"],
            inference_duration_ms=model_meta["inference_duration_ms"],
            parameters=model_meta["parameters"],
            metrics_summary=model_meta["metrics_summary"],
            status="SUCCESS"
        )
        db.add(model_run_record)

        # C. Persist Potential Spill Detection
        spill_rec = SpillDetection(
            investigation_id=inv.id,
            status="potential",
            confidence=characterization["confidence"],
            look_alike_risk=characterization["look_alike_risk"],
            look_alike_reasons=characterization["look_alike_reasons"],
            polygon_geometry=characterization["polygon_geometry"],
            centroid=characterization["centroid"],
            bbox=characterization["bbox"],
            estimated_area_sqkm=characterization["estimated_area_sqkm"],
            perimeter_km=characterization["perimeter_km"],
            orientation_deg=characterization["orientation_deg"],
            elongation=characterization["elongation"],
            connected_components_count=characterization["connected_components_count"],
            observation_timestamp=obs_time,
            detection_method=model_meta["model_name"],
            model_metadata=model_meta
        )
        db.add(spill_rec)
        db.flush()

        # D. Persist Backward & Forward Drift Runs
        drift_backward_rec = DriftRun(
            investigation_id=inv.id,
            spill_detection_id=spill_rec.id,
            direction="BACKWARD",
            status="COMPLETED",
            simulation_start_time=obs_time,
            simulation_end_time=obs_time - timedelta(hours=12),
            duration_hours=12.0,
            time_step_seconds=600,
            num_particles=settings.DRIFT_DEFAULT_PARTICLES,
            windage_factor=settings.DRIFT_DEFAULT_WINDAGE,
            diffusion_coefficient=settings.DRIFT_DEFAULT_DIFFUSION,
            environmental_data_source=env_field.source,
            result_polygon=backward_result["probable_origin_polygon"],
            release_window_start=backward_result["release_window_start"],
            release_window_end=backward_result["release_window_end"],
            uncertainty_radius_km=backward_result["uncertainty_radius_km"],
            particle_trajectories=backward_result["trajectories"]
        )
        db.add(drift_backward_rec)

        drift_forward_rec = DriftRun(
            investigation_id=inv.id,
            spill_detection_id=spill_rec.id,
            direction="FORWARD",
            status="COMPLETED",
            simulation_start_time=obs_time,
            simulation_end_time=obs_time + timedelta(hours=24),
            duration_hours=24.0,
            time_step_seconds=600,
            num_particles=settings.DRIFT_DEFAULT_PARTICLES,
            windage_factor=settings.DRIFT_DEFAULT_WINDAGE,
            diffusion_coefficient=settings.DRIFT_DEFAULT_DIFFUSION,
            environmental_data_source=env_field.source,
            result_polygon=forward_result["snapshots"].get("+24h", {}).get("spread_polygon"),
            coastal_impact_proximity_km=forward_result.get("coastal_impact_proximity_km")
        )
        db.add(drift_forward_rec)
        db.flush()

        # E. Persist Candidate Assessments & Evidence
        persisted_candidates = []
        for cand in scored_candidates:
            v_model = cand["db_vessel"]
            sd = cand["score_data"]

            assessment_rec = CandidateAssessment(
                investigation_id=inv.id,
                vessel_id=v_model.id,
                attribution_score=sd["attribution_score"],
                candidate_rank=sd["candidate_rank"],
                investigation_priority=sd["investigation_priority"],
                origin_compatibility_score=sd["origin_compatibility_score"],
                temporal_compatibility_score=sd["temporal_compatibility_score"],
                drift_compatibility_score=sd["drift_compatibility_score"],
                trajectory_compatibility_score=sd["trajectory_compatibility_score"],
                vessel_type_score=sd["vessel_type_score"],
                ais_quality_score=sd["ais_quality_score"],
                behavior_anomaly_score=sd["behavior_anomaly_score"],
                evidence_quality_score=sd["evidence_quality_score"],
                applied_weights=sd["applied_weights"],
                forensic_summary=sd["forensic_summary"]
            )
            db.add(assessment_rec)
            db.flush()

            # Generate and add evidence items
            ev_items = EvidenceEngine.generate_evidence_items(
                candidate_assessment=sd,
                vessel=cand["vessel"],
                analysis=cand["analysis"],
                investigation_id=str(inv.id),
                candidate_assessment_id=str(assessment_rec.id)
            )
            for ei in ev_items:
                ev_rec = Evidence(
                    investigation_id=inv.id,
                    candidate_assessment_id=assessment_rec.id,
                    title=ei["title"],
                    description=ei["description"],
                    direction=ei["direction"],
                    factor=ei["factor"],
                    weight=ei["weight"],
                    source=ei["source"],
                    timestamp=ei["timestamp"],
                    geometry=ei["geometry"],
                    data_quality=ei["data_quality"],
                    confidence=ei["confidence"]
                )
                db.add(ev_rec)

            persisted_candidates.append({
                "assessment_id": str(assessment_rec.id),
                "vessel_name": v_model.name,
                "attribution_score": sd["attribution_score"],
                "rank": sd["candidate_rank"],
                "priority": sd["investigation_priority"]
            })

        # F. Update Investigation Record
        inv.status = "COMPLETED"
        inv.structured_uncertainty = structured_uncertainty
        inv.executive_summary = {
            "spill_detected": True,
            "estimated_area_sqkm": characterization["estimated_area_sqkm"],
            "detection_confidence": characterization["confidence"],
            "look_alike_risk": characterization["look_alike_risk"],
            "total_candidates_evaluated": len(scored_candidates),
            "top_candidate": persisted_candidates[0] if persisted_candidates else None,
            "pipeline_executed_at": datetime.now(timezone.utc).isoformat()
        }
        db.commit()

        logger.info(f"Pipeline completed successfully for investigation {investigation_id}. Assessed {len(scored_candidates)} candidates.")

        # ----------------------------------------------------------------------
        # Step 21: Return structured investigation summary
        # ----------------------------------------------------------------------
        return {
            "status": "COMPLETED",
            "investigation_id": str(inv.id),
            "name": inv.name,
            "region": inv.region,
            "data_mode": inv.data_mode,
            "spill": {
                "id": str(spill_rec.id),
                "estimated_area_sqkm": spill_rec.estimated_area_sqkm,
                "confidence": spill_rec.confidence,
                "look_alike_risk": spill_rec.look_alike_risk,
                "centroid": spill_rec.centroid,
                "orientation_deg": spill_rec.orientation_deg
            },
            "origin_reconstruction": {
                "release_window_start": backward_result["release_window_start"].isoformat(),
                "release_window_end": backward_result["release_window_end"].isoformat(),
                "uncertainty_radius_km": backward_result["uncertainty_radius_km"]
            },
            "candidates": persisted_candidates,
            "structured_uncertainty": structured_uncertainty
        }
