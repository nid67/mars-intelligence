"""
Unit Tests for Explainable Attribution Engine.
Verifies score boundaries (0-100), weight consistency, and prioritization.
"""
from backend.app.engines.attribution import AttributionEngine


def test_attribution_scoring_primary_candidate():
    """Vessel that directly intersects the probable origin polygon during release window

    should receive a high attribution score and HIGH priority.
    """
    analysis = {
        "intersects_origin": True,
        "temporal_overlap": True,
        "closest_distance_to_origin_km": 0.0,
        "avg_speed_knots": 13.5,
        "detected_gaps": [],
        "speed_anomalies": [{"delta_knots": 5.0}],
        "course_anomalies": [],
        "positions_count": 25
    }

    vessel = {
        "name": "OCEAN VOYAGER",
        "vessel_type": "CRUDE_OIL_TANKER",
        "mmsi": "419000101"
    }

    score_data = AttributionEngine.score_candidate(analysis, vessel)

    assert 75.0 <= score_data["attribution_score"] <= 100.0
    assert score_data["investigation_priority"] == "HIGH"
    assert score_data["origin_compatibility_score"] == 1.0
    assert score_data["temporal_compatibility_score"] == 1.0
    assert score_data["vessel_type_score"] == 1.0
    assert score_data["ais_quality_score"] == 1.0


def test_attribution_scoring_distant_vessel():
    """Vessel far outside the origin region should receive a low attribution score."""
    analysis = {
        "intersects_origin": False,
        "temporal_overlap": False,
        "closest_distance_to_origin_km": 45.0,
        "avg_speed_knots": 14.0,
        "detected_gaps": [],
        "speed_anomalies": [],
        "course_anomalies": [],
        "positions_count": 20
    }

    vessel = {
        "name": "MUMBAI PEARL",
        "vessel_type": "BULK_CARRIER",
        "mmsi": "419000103"
    }

    score_data = AttributionEngine.score_candidate(analysis, vessel)

    assert score_data["attribution_score"] < 45.0
    assert score_data["investigation_priority"] in ["LOW", "MONITORING"]
    assert score_data["origin_compatibility_score"] < 0.1
