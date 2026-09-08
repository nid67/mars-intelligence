"""
Demo Management Pydantic Schemas.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DemoCaseSummary(BaseModel):
    case_id: str
    name: str
    region: str
    data_mode: str
    observation_time: str
    bbox: List[float]
    description: str
    center: List[float]
    total_vessels: int
    primary_candidate: Optional[str] = None


class DemoSeedResponse(BaseModel):
    status: str
    message: str
    seeded_cases_count: int
    cases: List[DemoCaseSummary]
    investigation_ids: Dict[str, str]


class DemoResetResponse(BaseModel):
    status: str
    message: str
    cleared_records: Dict[str, int]
