"""
API Endpoint Verification Tests.
Tests FastAPI routing, Pydantic validation, health checks, capabilities, and CRUD.
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert "MARS" in data["project"]
    assert "SIH26143" in data["sih_problem"]


def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["database_connected"] is True


def test_system_capabilities_endpoint():
    res = client.get("/api/v1/system/capabilities")
    assert res.status_code == 200
    data = res.json()
    assert "satellite" in data
    assert "environmental" in data
    assert "ais" in data
    assert "ml" in data
    assert data["legal_neutrality_enforced"] is True


def test_demo_cases_and_seeding():
    res_cases = client.get("/api/v1/demo/cases")
    assert res_cases.status_code == 200
    cases = res_cases.json()
    assert len(cases) >= 4

    res_seed = client.post("/api/v1/demo/seed")
    assert res_seed.status_code == 200
    assert res_seed.json()["status"] == "SUCCESS"


def test_investigations_list():
    res = client.get("/api/v1/investigations")
    assert res.status_code == 200
    invs = res.json()
    assert len(invs) >= 1
