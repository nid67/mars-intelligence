"""
Candidate Vessel Filtering Engine.
Applies multi-criteria spatial, temporal, and kinematic filters to generate
the qualified candidate vessel cohort for detailed forensic attribution scoring.
"""
from typing import List, Dict, Any
from datetime import datetime
from backend.app.core.logging import logger


class CandidateFilteringEngine:
    @staticmethod
    def filter_candidates(
        vessels_with_analysis: List[Dict[str, Any]],
        max_origin_distance_km: float = 35.0
    ) -> List[Dict[str, Any]]:
        """Filters broad vessel traffic into candidate source vessels based on multi-criteria bounds."""
        candidates = []

        for item in vessels_with_analysis:
            vessel = item["vessel"]
            analysis = item["analysis"]

            closest_dist = analysis.get("closest_distance_to_origin_km", 999.0)
            intersects_origin = analysis.get("intersects_origin", False)
            temporal_overlap = analysis.get("temporal_overlap", False)
            vessel_type = str(vessel.get("vessel_type", "")).upper()

            # Criterion 1: Spatial & Origin Compatibility
            # Vessel must either intersect the origin polygon or pass within threshold distance
            spatial_pass = intersects_origin or (closest_dist <= max_origin_distance_km)

            # Criterion 2: Vessel Capability Check
            # All large commercial vessels carry heavy fuel bunker or cargo; exclude only non-motorized/pleasure crafts
            type_pass = ("SAILING" not in vessel_type) and ("PLEASURE" not in vessel_type)

            # Criterion 3: Valid Telemetry Records
            data_pass = analysis.get("positions_count", 0) >= 2

            if spatial_pass and type_pass and data_pass:
                # Assign filtering qualification category
                if intersects_origin and temporal_overlap:
                    qualification = "PRIMARY_SPATIO_TEMPORAL_INTERSECTION"
                elif intersects_origin:
                    qualification = "SPATIAL_INTERSECTION_MARGINAL_TIME"
                elif closest_dist <= 15.0:
                    qualification = "PROXIMATE_CORRIDOR_TRANSIT"
                else:
                    qualification = "OUTER_ZONE_COMPATIBLE"

                item["qualification"] = qualification
                candidates.append(item)
            else:
                logger.debug(
                    f"Vessel {vessel.get('mmsi')} filtered out: spatial={spatial_pass} "
                    f"(dist={closest_dist}km), type={type_pass}, data={data_pass}"
                )

        return candidates
