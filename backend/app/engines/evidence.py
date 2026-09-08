"""
Evidence Generation Engine.
Synthesizes structured evidentiary items categorized into SUPPORTING and CONTRADICTING evidence.
Ensures every forensic claim is accompanied by factor metadata, weights, source, and confidence.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime


class EvidenceEngine:
    @staticmethod
    def generate_evidence_items(
        candidate_assessment: Dict[str, Any],
        vessel: Dict[str, Any],
        analysis: Dict[str, Any],
        investigation_id: str,
        candidate_assessment_id: str
    ) -> List[Dict[str, Any]]:
        """Generates comprehensive supporting and contradicting evidence records for a candidate vessel."""
        evidence_items = []

        closest_dist = analysis.get("closest_distance_to_origin_km", 999.0)
        intersects_origin = analysis.get("intersects_origin", False)
        temporal_overlap = analysis.get("temporal_overlap", False)
        detected_gaps = analysis.get("detected_gaps", [])
        speed_anomalies = analysis.get("speed_anomalies", [])
        course_anomalies = analysis.get("course_anomalies", [])
        v_type = str(vessel.get("vessel_type", "")).upper()
        origin_transit_time = analysis.get("origin_transit_time")

        # ----------------------------------------------------------------------
        # 1. SPATIAL & ORIGIN REGION EVIDENCE
        # ----------------------------------------------------------------------
        if intersects_origin:
            evidence_items.append({
                "investigation_id": investigation_id,
                "candidate_assessment_id": candidate_assessment_id,
                "title": "Direct Intersection with Probable Origin Region",
                "description": (
                    f"Reconstructed AIS track for vessel '{vessel.get('name')}' directly passed inside "
                    "the physical backward Lagrangian probable origin polygon."
                ),
                "direction": "SUPPORTING",
                "factor": "ORIGIN_SPATIAL",
                "weight": 1.0,
                "source": "LAGRANGIAN_BACKTRACKING_ENGINE",
                "timestamp": origin_transit_time,
                "geometry": analysis.get("geojson_linestring"),
                "data_quality": 0.95,
                "confidence": 0.95
            })
        elif closest_dist <= 15.0:
            evidence_items.append({
                "investigation_id": investigation_id,
                "candidate_assessment_id": candidate_assessment_id,
                "title": f"Proximate Transit ({closest_dist:.1f} km from Origin)",
                "description": (
                    f"Vessel passed within {closest_dist:.1f} km of the probable origin region boundary. "
                    "Within lateral turbulent diffusion dispersion margin."
                ),
                "direction": "SUPPORTING",
                "factor": "ORIGIN_SPATIAL",
                "weight": 0.7,
                "source": "LAGRANGIAN_BACKTRACKING_ENGINE",
                "timestamp": origin_transit_time,
                "geometry": None,
                "data_quality": 0.85,
                "confidence": 0.80
            })
        else:
            evidence_items.append({
                "investigation_id": investigation_id,
                "candidate_assessment_id": candidate_assessment_id,
                "title": f"Divergent Trajectory ({closest_dist:.1f} km from Origin)",
                "description": (
                    f"Vessel maintained an offset distance of {closest_dist:.1f} km from the estimated "
                    "origin polygon, well outside the estimated lateral diffusion radius."
                ),
                "direction": "CONTRADICTING",
                "factor": "ORIGIN_SPATIAL",
                "weight": 1.0,
                "source": "SPATIAL_INTERSECTION_ANALYZER",
                "timestamp": None,
                "geometry": None,
                "data_quality": 0.90,
                "confidence": 0.90
            })

        # ----------------------------------------------------------------------
        # 2. TEMPORAL COMPATIBILITY EVIDENCE
        # ----------------------------------------------------------------------
        if temporal_overlap:
            evidence_items.append({
                "investigation_id": investigation_id,
                "candidate_assessment_id": candidate_assessment_id,
                "title": "Transit Chronologically Aligned with Estimated Release Window",
                "description": (
                    f"Vessel transit time ({origin_transit_time}) coincides with the "
                    "physical backward particle transport temporal envelope."
                ),
                "direction": "SUPPORTING",
                "factor": "TEMPORAL_WINDOW",
                "weight": 0.9,
                "source": "TEMPORAL_CORRELATION_ENGINE",
                "timestamp": origin_transit_time,
                "geometry": None,
                "data_quality": 0.90,
                "confidence": 0.90
            })
        elif not intersects_origin:
            evidence_items.append({
                "investigation_id": investigation_id,
                "candidate_assessment_id": candidate_assessment_id,
                "title": "Temporal-Spatial Disalignment",
                "description": "Vessel was not in spatial vicinity during the estimated release window.",
                "direction": "CONTRADICTING",
                "factor": "TEMPORAL_WINDOW",
                "weight": 0.8,
                "source": "TEMPORAL_CORRELATION_ENGINE",
                "timestamp": None,
                "geometry": None,
                "data_quality": 0.85,
                "confidence": 0.85
            })

        # ----------------------------------------------------------------------
        # 3. VESSEL TYPE & CARGO CAPABILITY
        # ----------------------------------------------------------------------
        if "CRUDE" in v_type or "TANKER" in v_type or "OIL" in v_type:
            evidence_items.append({
                "investigation_id": investigation_id,
                "candidate_assessment_id": candidate_assessment_id,
                "title": f"High Capacity Hydrocarbon Carrier ({vessel.get('vessel_type')})",
                "description": (
                    f"Vessel is registered as a {vessel.get('vessel_type')}, carrying commercial liquid "
                    "bulk hydrocarbon cargo and substantial heavy fuel oil bunkers."
                ),
                "direction": "SUPPORTING",
                "factor": "VESSEL_CAPABILITY",
                "weight": 0.6,
                "source": "VESSEL_REGISTRY",
                "timestamp": None,
                "geometry": None,
                "data_quality": 1.0,
                "confidence": 0.95
            })
        elif "FISHING" in v_type or "TUG" in v_type:
            evidence_items.append({
                "investigation_id": investigation_id,
                "candidate_assessment_id": candidate_assessment_id,
                "title": f"Small Craft Class ({vessel.get('vessel_type')})",
                "description": "Vessel tonnage and fuel capacity are limited relative to the estimated spill volume.",
                "direction": "CONTRADICTING",
                "factor": "VESSEL_CAPABILITY",
                "weight": 0.7,
                "source": "VESSEL_REGISTRY",
                "timestamp": None,
                "geometry": None,
                "data_quality": 0.90,
                "confidence": 0.85
            })

        # ----------------------------------------------------------------------
        # 4. AIS TELEMETRY CONTINUITY & GAPS
        # ----------------------------------------------------------------------
        if detected_gaps:
            max_gap = max(g.get("gap_duration_hours", 0.0) for g in detected_gaps)
            evidence_items.append({
                "investigation_id": investigation_id,
                "candidate_assessment_id": candidate_assessment_id,
                "title": f"AIS Reception Discontinuity ({max_gap:.1f}h Gap)",
                "description": (
                    f"A telemetry reception interruption of {max_gap:.1f} hours was logged. "
                    "Recorded forensically as a data quality indicator representing reduced position confidence."
                ),
                "direction": "CONTRADICTING",  # Contradicts complete verifiable track confidence
                "factor": "AIS_INTEGRITY",
                "weight": 0.5,
                "source": "AIS_KINEMATIC_AUDITOR",
                "timestamp": None,
                "geometry": None,
                "data_quality": 0.70,
                "confidence": 0.90
            })
        else:
            evidence_items.append({
                "investigation_id": investigation_id,
                "candidate_assessment_id": candidate_assessment_id,
                "title": "Continuous Verified AIS Telemetry",
                "description": "Vessel broadcasted consistent position reports throughout the investigation period with no gaps > 2.0h.",
                "direction": "SUPPORTING",
                "factor": "AIS_INTEGRITY",
                "weight": 0.5,
                "source": "AIS_KINEMATIC_AUDITOR",
                "timestamp": None,
                "geometry": None,
                "data_quality": 0.95,
                "confidence": 0.95
            })

        # ----------------------------------------------------------------------
        # 5. KINEMATIC BEHAVIOR
        # ----------------------------------------------------------------------
        if speed_anomalies:
            evidence_items.append({
                "investigation_id": investigation_id,
                "candidate_assessment_id": candidate_assessment_id,
                "title": "Notable Speed Alteration Recorded",
                "description": speed_anomalies[0].get("description", "Kinematic speed alteration logged."),
                "direction": "SUPPORTING",
                "factor": "TRAJECTORY_KINEMATICS",
                "weight": 0.4,
                "source": "AIS_KINEMATIC_AUDITOR",
                "timestamp": None,
                "geometry": None,
                "data_quality": 0.85,
                "confidence": 0.85
            })

        return evidence_items
