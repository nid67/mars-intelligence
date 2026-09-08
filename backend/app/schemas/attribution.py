"""
Attribution & Candidate Assessment Pydantic Schemas (Pydantic v2).
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.vessel import VesselResponse


class EvidenceItemSummary(BaseModel):
    id: str
    title: str
    description: str
    direction: str  # SUPPORTING | CONTRADICTING
    factor: str
    weight: float
    confidence: float
    timestamp: Optional[datetime] = None


class CandidateAssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    vessel_id: str
    vessel: Optional[VesselResponse] = None

    attribution_score: float = Field(..., ge=0.0, le=100.0, json_schema_extra={"example": 87.5})
    candidate_rank: int
    investigation_priority: str

    origin_compatibility_score: float
    temporal_compatibility_score: float
    drift_compatibility_score: float
    trajectory_compatibility_score: float
    vessel_type_score: float
    ais_quality_score: float
    behavior_anomaly_score: float
    evidence_quality_score: float

    applied_weights: Optional[Dict[str, float]] = None
    forensic_summary: Optional[str] = None

    supporting_evidence: List[EvidenceItemSummary] = []
    contradicting_evidence: List[EvidenceItemSummary] = []

    created_at: datetime


class AttributionRankingResponse(BaseModel):
    investigation_id: str
    total_candidates_assessed: int
    top_candidate: Optional[CandidateAssessmentResponse] = None
    candidates: List[CandidateAssessmentResponse]
    applied_weights: Dict[str, float]
    methodology_note: str = (
        "Attribution scores are forensic screening indices (0-100) based on spatial, temporal, "
        "environmental, and trajectory compatibility. Scores do NOT represent legal guilt or certainty."
    )
