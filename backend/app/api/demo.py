"""
Demo API Router.
Provides endpoints for seeding generic scenarios (Arabian Sea, Bay of Bengal, Andaman Sea, Ennore),
resetting test databases, and inspecting available demonstration scenarios.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.services.demo_service import DemoService
from backend.app.schemas.demo import DemoSeedResponse, DemoResetResponse, DemoCaseSummary

router = APIRouter(prefix="/demo", tags=["Demonstration Scenarios"])


@router.post("/seed", response_model=DemoSeedResponse)
def seed_demo_scenarios(db: Session = Depends(get_db)):
    """Idempotently seed the 4 generic demonstration scenarios:

    1. Arabian Sea (Mumbai High / Transit Corridor)
    2. Bay of Bengal (East Coast Approach / Visakhapatnam)
    3. Andaman Sea (Six Degree Channel / Malacca Approach)
    4. Ennore Optional (Historical January 2017 Collision Case)
    """
    return DemoService.seed_demo_cases(db=db)


@router.post("/reset", response_model=DemoResetResponse)
def reset_demo_data(db: Session = Depends(get_db)):
    """Reset all seeded demo data from the database."""
    return DemoService.reset_demo_cases(db=db)


@router.get("/cases")
def list_demo_cases():
    """List available pre-configured demonstration scenarios from data/demo/."""
    return DemoService.list_demo_cases()
