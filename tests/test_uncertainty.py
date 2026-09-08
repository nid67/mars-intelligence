"""
Unit Tests for Structured Uncertainty Engine.
Verifies that multi-source uncertainty is computed across 8 independent forensic dimensions.
"""
from backend.app.engines.uncertainty import UncertaintyEngine


def test_structured_uncertainty_decomposition():
    spill_data = {
        "look_alike_risk": 0.15,
        "connected_components_count": 1
    }
    drift_data = {
        "uncertainty_radius_km": 8.5,
        "duration_hours": 12.0,
        "windage_factor": 0.032
    }
    vessel_analyses = [
        {"detected_gaps": []},
        {"detected_gaps": [{"gap_duration_hours": 2.5}]}
    ]
    candidate_scores = [88.5, 62.0, 31.0]

    uncertainty = UncertaintyEngine.calculate_structured_uncertainty(
        spill_data=spill_data,
        drift_data=drift_data,
        vessel_analyses=vessel_analyses,
        candidate_scores=candidate_scores,
        data_mode="DEMONSTRATION"
    )

    required_keys = [
        "detection_uncertainty",
        "segmentation_uncertainty",
        "origin_region_uncertainty",
        "release_window_uncertainty",
        "environmental_uncertainty",
        "ais_data_uncertainty",
        "drift_model_uncertainty",
        "attribution_uncertainty",
        "overall_forensic_confidence"
    ]

    for k in required_keys:
        assert k in uncertainty
        assert 0.0 <= uncertainty[k] <= 1.0
