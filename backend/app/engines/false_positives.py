"""
False Positive Rejection and Look-Alike Assessment Engine.
Evaluates SAR dark formations against environmental, geometric, and coastal constraints.
"""
from typing import List, Dict, Any, Tuple
import numpy as np


class FalsePositiveFilter:
    @staticmethod
    def evaluate_look_alike_risk(
        wind_speed_mps: float,
        coastal_distance_km: float,
        elongation: float,
        area_sqkm: float,
        mean_contrast_db: float,
        border_proximity_px: int
    ) -> Tuple[float, List[str]]:
        """Computes a look-alike risk index (0.0 to 1.0) and identifies contributing factors.

        0.0 = High likelihood of true mineral hydrocarbon
        1.0 = High likelihood of false positive / natural phenomenon
        """
        reasons = []
        risk_score = 0.0

        # 1. Low wind damping look-alike (< 3.0 m/s creates wide mirror-calm dark patches)
        if wind_speed_mps < 2.5:
            risk_score += 0.45
            reasons.append("LOW_WIND_MIRROR_CALM (< 2.5 m/s): Surface tension dampening is non-specific")
        elif wind_speed_mps < 3.5:
            risk_score += 0.20
            reasons.append("MARGINAL_WIND_SPEED (2.5 - 3.5 m/s): Increased false-positive risk")

        # 2. Coastal mudflat / land shadow proximity (< 1.5 km)
        if coastal_distance_km < 1.0:
            risk_score += 0.35
            reasons.append("COASTAL_PROXIMITY (< 1.0 km): Possible topographic radar shadow or tidal mudflat")
        elif coastal_distance_km < 2.5:
            risk_score += 0.15
            reasons.append("NEAR_SHORE_ZONE (< 2.5 km): Shallow water bathymetry effect")

        # 3. Shape & Elongation (Wakes have extreme elongation > 7.0; biogenic slicks are diffuse)
        if elongation > 8.0:
            risk_score += 0.25
            reasons.append("EXTREME_ELONGATION (> 8.0): High probability of linear ship wake")
        elif elongation < 1.3 and area_sqkm > 50.0:
            risk_score += 0.30
            reasons.append("DIFFUSE_EQUIAXIAL_EXTENT: Characteristic of regional biogenic film")

        # 4. Radiometric contrast margin (< 3.5 dB contrast indicates weak/diffuse boundary)
        if mean_contrast_db < 3.5:
            risk_score += 0.25
            reasons.append(f"LOW_RADAR_CONTRAST ({mean_contrast_db:.1f} dB): Weak slick boundary")

        # 5. Image border artifact
        if border_proximity_px < 5:
            risk_score += 0.20
            reasons.append("IMAGE_BOUNDARY_TRUNCATION: Patch clipped at raster edge")

        final_risk = float(np.clip(risk_score, 0.05, 0.95))
        return round(final_risk, 3), reasons
