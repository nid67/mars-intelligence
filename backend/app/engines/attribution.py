"""
Deterministic & Explainable Attribution Scoring Engine.
Calculates a multi-factor forensic screening score (0.0 - 100.0) based on
spatial, temporal, hydrodynamic drift, trajectory stability, and AIS data quality.
Adheres strictly to scientific neutrality: attribution scores are screening indices,
NEVER legal proof, certainty, or probability of guilt.
"""
from typing import Dict, Any, List
import math
from backend.app.core.config import settings


class AttributionEngine:
    @staticmethod
    def score_candidate(
        analysis: Dict[str, Any],
        vessel: Dict[str, Any],
        weights: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """Calculates normalized component scores (0.0 to 1.0) and the composite attribution score (0 to 100)."""
        if weights is None:
            weights = settings.ATTRIBUTION_WEIGHTS

        # Normalize weights to ensure sum is exactly 1.0
        total_weight = sum(weights.values())
        norm_weights = {k: v / total_weight for k, v in weights.items()}

        # 1. Origin Compatibility Score (Weight ~ 0.25)
        # 1.0 if trajectory directly intersects the probable origin polygon;
        # otherwise decays exponentially with distance (characteristic decay length = 12 km)
        closest_dist = analysis.get("closest_distance_to_origin_km", 999.0)
        intersects_origin = analysis.get("intersects_origin", False)
        if intersects_origin:
            origin_score = 1.0
        else:
            origin_score = float(math.exp(-closest_dist / 12.0))
        origin_score = max(0.0, min(1.0, origin_score))

        # 2. Temporal Compatibility Score (Weight ~ 0.20)
        # 1.0 if vessel transit overlapped with the release window;
        # 0.7 if within 2 hours; decays for greater time offsets
        if analysis.get("temporal_overlap", False):
            temporal_score = 1.0
        elif intersects_origin:
            temporal_score = 0.75
        elif closest_dist < 10.0:
            temporal_score = 0.50
        else:
            temporal_score = 0.20

        # 3. Drift Compatibility Score (Weight ~ 0.20)
        # Measures whether the vessel was positioned upstream relative to the drift vector
        # If the vessel intersected origin, drift compatibility is maximized
        if intersects_origin:
            drift_score = 0.95
        elif closest_dist <= 15.0:
            drift_score = 0.65
        else:
            drift_score = max(0.1, float(math.exp(-closest_dist / 18.0)))

        # 4. Trajectory Compatibility Score (Weight ~ 0.15)
        # Stable commercial transit speed and trajectory consistency
        avg_speed = analysis.get("avg_speed_knots", 12.0)
        if 8.0 <= avg_speed <= 18.0:
            traj_score = 0.90
        elif 4.0 <= avg_speed < 8.0 or 18.0 < avg_speed <= 24.0:
            traj_score = 0.70
        else:
            traj_score = 0.40

        # 5. Vessel Type & Capacity Factor (Weight ~ 0.05)
        v_type = str(vessel.get("vessel_type", "")).upper()
        if "CRUDE" in v_type or "OIL" in v_type or "TANKER" in v_type:
            type_score = 1.00
        elif "CHEMICAL" in v_type or "BUNKER" in v_type:
            type_score = 0.90
        elif "CARGO" in v_type or "BULK" in v_type or "CONTAINER" in v_type:
            type_score = 0.70  # Heavy fuel oil propulsion bunkers
        elif "TUG" in v_type or "FISHING" in v_type:
            type_score = 0.40
        else:
            type_score = 0.30

        # 6. AIS Data Quality Factor (Weight ~ 0.05)
        # High quality if continuous broadcasts with no significant reception gaps
        detected_gaps = analysis.get("detected_gaps", [])
        if not detected_gaps:
            ais_quality_score = 1.00
        else:
            total_gap_hours = sum(g.get("gap_duration_hours", 0.0) for g in detected_gaps)
            ais_quality_score = max(0.2, 1.0 - (total_gap_hours / 12.0))

        # 7. Trajectory Discontinuity / Behavior Score (Weight ~ 0.05)
        # Detects whether notable course or speed alterations occurred near the origin region
        speed_anomalies = analysis.get("speed_anomalies", [])
        course_anomalies = analysis.get("course_anomalies", [])
        if speed_anomalies or course_anomalies:
            behavior_score = 0.85
        else:
            behavior_score = 0.50

        # 8. Evidence Consistency & Sensor Quality (Weight ~ 0.05)
        pos_count = analysis.get("positions_count", 0)
        if pos_count >= 15:
            evidence_score = 1.00
        elif pos_count >= 5:
            evidence_score = 0.80
        else:
            evidence_score = 0.50

        # Calculate composite weighted sum
        composite = (
            norm_weights["origin_compatibility"] * origin_score +
            norm_weights["temporal_compatibility"] * temporal_score +
            norm_weights["drift_compatibility"] * drift_score +
            norm_weights["trajectory_compatibility"] * traj_score +
            norm_weights["vessel_type"] * type_score +
            norm_weights["ais_quality"] * ais_quality_score +
            norm_weights["trajectory_behavior"] * behavior_score +
            norm_weights["evidence_quality"] * evidence_score
        )

        final_score = round(composite * 100.0, 1)

        # Categorize investigation priority
        if final_score >= 75.0:
            priority = "HIGH"
        elif final_score >= 50.0:
            priority = "MEDIUM"
        elif final_score >= 30.0:
            priority = "LOW"
        else:
            priority = "MONITORING"

        # Forensic summary string
        summary = (
            f"Vessel {vessel.get('name', 'UNKNOWN')} evaluated with Attribution Score {final_score:.1f}/100 "
            f"(Priority: {priority}). Origin compatibility: {origin_score:.2f}, "
            f"Temporal: {temporal_score:.2f}, Drift: {drift_score:.2f}."
        )

        return {
            "attribution_score": final_score,
            "investigation_priority": priority,
            "origin_compatibility_score": round(origin_score, 3),
            "temporal_compatibility_score": round(temporal_score, 3),
            "drift_compatibility_score": round(drift_score, 3),
            "trajectory_compatibility_score": round(traj_score, 3),
            "vessel_type_score": round(type_score, 3),
            "ais_quality_score": round(ais_quality_score, 3),
            "behavior_anomaly_score": round(behavior_score, 3),
            "evidence_quality_score": round(evidence_score, 3),
            "applied_weights": norm_weights,
            "forensic_summary": summary
        }
