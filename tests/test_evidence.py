"""
Unit Tests for Evidence Engine.
Verifies generation of structured supporting and contradicting evidence items.
"""
from datetime import datetime, timezone
from backend.app.engines.evidence import EvidenceEngine


def test_evidence_generation_supporting_and_contradicting():
    candidate_assessment = {"attribution_score": 88.0}
    vessel = {
        "name": "ARABIAN STAR",
        "vessel_type": "PRODUCT_TANKER",
        "mmsi": "419000102"
    }
    analysis = {
        "intersects_origin": True,
        "temporal_overlap": True,
        "closest_distance_to_origin_km": 0.0,
        "origin_transit_time": datetime(2026, 3, 14, 2, 15, tzinfo=timezone.utc),
        "detected_gaps": [{"gap_duration_hours": 3.5}],
        "speed_anomalies": [{"description": "Speed reduction of 4.2 knots"}],
        "course_anomalies": []
    }

    items = EvidenceEngine.generate_evidence_items(
        candidate_assessment=candidate_assessment,
        vessel=vessel,
        analysis=analysis,
        investigation_id="inv-test-01",
        candidate_assessment_id="ass-test-01"
    )

    assert len(items) >= 4

    supporting = [e for e in items if e["direction"] == "SUPPORTING"]
    contradicting = [e for e in items if e["direction"] == "CONTRADICTING"]

    assert len(supporting) >= 2
    assert len(contradicting) >= 1

    # Check that AIS gap is categorized under CONTRADICTING evidence with neutral language
    gap_ev = next(e for e in contradicting if e["factor"] == "AIS_INTEGRITY")
    assert "Discontinuity" in gap_ev["title"] or "Gap" in gap_ev["title"]
    assert "data quality indicator" in gap_ev["description"].lower()
