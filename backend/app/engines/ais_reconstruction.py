"""
AIS Trajectory Reconstruction and Kinematic Engine.
Cleans raw positions, detects reception gaps, calculates speed/course kinematics,
and evaluates spatial intersection with the Probable Origin Region.
Maintains forensic neutrality: uses objective kinematic terms without presumption of guilt.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import math
from shapely.geometry import Point, LineString, Polygon, shape
from backend.app.providers.internal_models import AISRecord, VesselTrack


class AISTrajectoryReconstructor:
    @staticmethod
    def reconstruct_and_analyze(
        records: List[AISRecord],
        origin_polygon_geojson: Optional[Dict[str, Any]] = None,
        release_window_start: Optional[datetime] = None,
        release_window_end: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Processes raw telemetry records into a validated kinematic trajectory."""
        if not records:
            return {
                "valid": False,
                "positions_count": 0,
                "track_length_km": 0.0,
                "intersects_origin": False,
                "origin_transit_time": None,
                "closest_distance_to_origin_km": 999.0,
                "speed_anomalies": [],
                "course_anomalies": [],
                "detected_gaps": [],
                "avg_speed_knots": 0.0,
                "max_speed_knots": 0.0,
                "geojson_linestring": None
            }

        # 1. Coordinate Validation & Timestamp Sorting
        valid_records: List[AISRecord] = []
        for r in records:
            if -90.0 <= r.latitude <= 90.0 and -180.0 <= r.longitude <= 180.0:
                valid_records.append(r)

        valid_records.sort(key=lambda x: x.timestamp)

        # 2. Kinematic Metrics & Gap Detection
        total_dist_km = 0.0
        speeds = []
        gaps = []
        course_changes = []
        speed_changes = []
        stops_count = 0

        coords_linestring = []

        origin_poly = shape(origin_polygon_geojson) if origin_polygon_geojson else None
        intersects_origin = False
        origin_transit_time = None
        min_dist_to_origin_km = float("inf")

        for i, pos in enumerate(valid_records):
            coords_linestring.append([pos.longitude, pos.latitude])
            speeds.append(pos.speed_knots)

            if pos.speed_knots < 1.0:
                stops_count += 1

            # Origin Polygon Proximity / Intersection
            pt = Point(pos.longitude, pos.latitude)
            if origin_poly:
                if origin_poly.contains(pt) or origin_poly.touches(pt):
                    intersects_origin = True
                    if origin_transit_time is None:
                        origin_transit_time = pos.timestamp
                    min_dist_to_origin_km = 0.0
                else:
                    # Distance in degrees converted to approx km
                    dist_deg = origin_poly.distance(pt)
                    dist_km = dist_deg * 111.0
                    if dist_km < min_dist_to_origin_km:
                        min_dist_to_origin_km = dist_km

            if i > 0:
                prev = valid_records[i - 1]
                dt_hours = (pos.timestamp - prev.timestamp).total_seconds() / 3600.0

                # Gap detection (> 2.0 hours)
                if dt_hours > 2.0:
                    gaps.append({
                        "gap_duration_hours": round(dt_hours, 2),
                        "start_time": prev.timestamp.isoformat(),
                        "end_time": pos.timestamp.isoformat(),
                        "description": f"AIS reception gap of {dt_hours:.1f} hours detected between broadcasts"
                    })

                # Distance step (Haversine)
                dlat = math.radians(pos.latitude - prev.latitude)
                dlon = math.radians(pos.longitude - prev.longitude)
                a = (math.sin(dlat / 2.0)**2 +
                     math.cos(math.radians(prev.latitude)) * math.cos(math.radians(pos.latitude)) *
                     math.sin(dlon / 2.0)**2)
                step_dist_km = 6371.0 * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
                total_dist_km += step_dist_km

                # Speed change delta
                delta_speed = abs(pos.speed_knots - prev.speed_knots)
                if delta_speed > 4.0:
                    speed_changes.append({
                        "timestamp": pos.timestamp.isoformat(),
                        "delta_knots": round(delta_speed, 1),
                        "description": f"Notable speed alteration of {delta_speed:.1f} knots"
                    })

                # Course change delta
                delta_course = abs(pos.course_deg - prev.course_deg)
                if delta_course > 180.0:
                    delta_course = 360.0 - delta_course
                if delta_course > 35.0:
                    course_changes.append({
                        "timestamp": pos.timestamp.isoformat(),
                        "delta_deg": round(delta_course, 1),
                        "description": f"Notable course alteration of {delta_course:.1f} degrees"
                    })

        avg_speed = float(sum(speeds) / len(speeds)) if speeds else 0.0
        max_speed = float(max(speeds)) if speeds else 0.0

        # Temporal intersection check with release window
        temporal_overlap = False
        if origin_transit_time and release_window_start and release_window_end:
            # Check if transit was within window or close (+- 2h)
            buffer = 7200.0  # 2 hours in seconds
            win_start = release_window_start.timestamp() - buffer
            win_end = release_window_end.timestamp() + buffer
            transit_ts = origin_transit_time.timestamp()
            temporal_overlap = (win_start <= transit_ts <= win_end)

        geojson_line = {
            "type": "LineString",
            "coordinates": coords_linestring
        } if len(coords_linestring) >= 2 else None

        return {
            "valid": True,
            "positions_count": len(valid_records),
            "track_length_km": round(total_dist_km, 2),
            "avg_speed_knots": round(avg_speed, 1),
            "max_speed_knots": round(max_speed, 1),
            "intersects_origin": intersects_origin,
            "temporal_overlap": temporal_overlap,
            "origin_transit_time": origin_transit_time,
            "closest_distance_to_origin_km": round(min_dist_to_origin_km, 2) if min_dist_to_origin_km != float("inf") else 999.0,
            "detected_gaps": gaps,
            "speed_anomalies": speed_changes,
            "course_anomalies": course_changes,
            "stops_count": stops_count,
            "geojson_linestring": geojson_line
        }
