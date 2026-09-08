"""
Integration Tests for Demo Seeding and Case Inspection.
Verifies that all 4 generic scenarios (Arabian Sea, Bay of Bengal, Andaman Sea, Ennore)
seed cleanly and idempotently into the database.
"""
import pytest
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.services.demo_service import DemoService
from backend.app.models.investigation import Investigation


@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


def test_list_demo_cases():
    """Verify that case.json files are properly discovered."""
    cases = DemoService.list_demo_cases()
    assert len(cases) >= 4

    regions = [c["region"] for c in cases]
    assert "Arabian Sea" in regions
    assert "Bay of Bengal" in regions
    assert "Andaman Sea" in regions


def test_idempotent_demo_seed(db_session):
    """Verify that seeding creates records and does not duplicate on repeat execution."""
    res1 = DemoService.seed_demo_cases(db_session)
    assert res1["status"] == "SUCCESS"
    assert res1["seeded_cases_count"] >= 4

    # Count investigations
    count1 = db_session.query(Investigation).count()
    assert count1 >= 4

    # Run seed again - must be idempotent
    res2 = DemoService.seed_demo_cases(db_session)
    count2 = db_session.query(Investigation).count()
    assert count1 == count2
