"""
Complete End-to-End Forensic Investigation Pipeline Integration Test.
Verifies the complete workflow:
Seed -> Run Pipeline -> Potential Spill -> Backward/Forward Drift -> AIS Correlation ->
Attribution Scoring -> Evidence Generation -> Structured Uncertainty -> GeoJSON Maps -> Forensic Report.
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_complete_investigation_pipeline():
    # 1. Seed Demo Cases
    seed_res = client.post("/api/v1/demo/seed")
    assert seed_res.status_code == 200
    inv_ids = seed_res.json()["investigation_ids"]
    assert len(inv_ids) >= 1

    # Select Arabian Sea case ID
    arabian_case_id = inv_ids.get("case-arabian-sea-001") or list(inv_ids.values())[0]

    # 2. Run Pipeline
    run_res = client.post(f"/api/v1/investigations/{arabian_case_id}/run")
    assert run_res.status_code == 200, f"Pipeline failed: {run_res.text}"
    pipeline_data = run_res.json()

    assert pipeline_data["status"] == "COMPLETED"
    assert "spill" in pipeline_data
    assert pipeline_data["spill"]["estimated_area_sqkm"] > 0.0
    assert 0.0 <= pipeline_data["spill"]["confidence"] <= 1.0
    assert "origin_reconstruction" in pipeline_data
    assert len(pipeline_data["candidates"]) >= 1

    top_cand = pipeline_data["candidates"][0]
    assert 0.0 <= top_cand["attribution_score"] <= 100.0
    assert top_cand["priority"] in ["HIGH", "MEDIUM", "LOW"]

    # 3. Verify Investigation Summary Endpoint
    summary_res = client.get(f"/api/v1/investigations/{arabian_case_id}/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["spill"] is not None
    assert summary["probable_origin_region"] is not None
    assert len(summary["candidate_ranking"]) >= 1

    # Check top candidate has supporting evidence
    top_summary = summary["candidate_ranking"][0]
    assert len(top_summary["supporting_evidence"]) >= 1
    assert "score_breakdown" in top_summary

    # Check structured uncertainty
    assert "structured_uncertainty" in summary
    assert "overall_forensic_confidence" in summary["structured_uncertainty"]

    # 4. Verify GeoJSON Map Endpoint & Layers
    map_res = client.get(f"/api/v1/investigations/{arabian_case_id}/map")
    assert map_res.status_code == 200
    map_data = map_res.json()
    assert "layers" in map_data
    assert "spill" in map_data["layers"]
    assert "origin" in map_data["layers"]
    assert "drift" in map_data["layers"]
    assert "vessels" in map_data["layers"]
    assert "environment" in map_data["layers"]
    assert "coastline" in map_data["layers"]

    # Check features in layers
    assert len(map_data["layers"]["spill"]["features"]) >= 1
    assert len(map_data["layers"]["origin"]["features"]) >= 1
    assert len(map_data["layers"]["vessels"]["features"]) >= 1

    # 5. Verify Individual GIS Sub-layer Endpoints
    spill_layer_res = client.get(f"/api/v1/investigations/{arabian_case_id}/map/spill")
    assert spill_layer_res.status_code == 200
    assert spill_layer_res.json()["type"] == "FeatureCollection"

    vessels_layer_res = client.get(f"/api/v1/investigations/{arabian_case_id}/map/vessels")
    assert vessels_layer_res.status_code == 200
    assert vessels_layer_res.json()["type"] == "FeatureCollection"

    # 6. Verify Investigation Report Endpoint
    report_res = client.get(f"/api/v1/investigations/{arabian_case_id}/report")
    assert report_res.status_code == 200
    report = report_res.json()

    assert "executive_summary" in report
    assert "spill_detection" in report
    assert "origin_reconstruction" in report
    assert "vessel_candidates" in report
    assert "attribution_scores" in report
    assert "supporting_evidence" in report
    assert "contradicting_evidence" in report
    assert "uncertainty_analysis" in report
    assert "scientific_limitations" in report
    assert "legal_disclaimer" in report

    # Verify legal disclaimer strictly maintains non-certainty
    assert "not establish legal responsibility or guilt" in report["legal_disclaimer"].lower()
