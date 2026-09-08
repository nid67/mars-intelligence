"""
Evidence Pydantic Schemas (Pydantic v2).
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class EvidenceBase(BaseModel):
    investigation_id: str
    candidate_assessment_id: str
    title: str = Field(..., json_schema_extra={"example": "Trajectory Intersects Probable Origin Region"})
    description: str = Field(..., json_schema_extra={"example": "Vessel track passed within 1.2 km of the backward drift centroid during the release window."})
    direction: str = Field(..., json_schema_extra={"example": "SUPPORTING"})  # SUPPORTING | CONTRADICTING
    factor: str = Field(..., json_schema_extra={"example": "ORIGIN_SPATIAL"})
    weight: float = Field(default=1.0, ge=0.0)
    source: str = Field(default="MARS_EVIDENCE_ENGINE")
    timestamp: Optional[datetime] = None
    geometry: Optional[Dict[str, Any]] = None
    data_quality: float = Field(default=1.0, ge=0.0, le=1.0)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class EvidenceCreate(EvidenceBase):
    pass


class EvidenceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    direction: Optional[str] = None
    weight: Optional[float] = None
    confidence: Optional[float] = None


class EvidenceResponse(EvidenceBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
