"""
Evidence Table Model.
Stores individual evidentiary items categorized as SUPPORTING or CONTRADICTING.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.types import GUID, GeoJSONGeometry


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    investigation_id = Column(GUID(), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_assessment_id = Column(GUID(), ForeignKey("candidate_assessments.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=False)
    direction = Column(String(20), nullable=False, index=True)  # SUPPORTING | CONTRADICTING
    factor = Column(String(100), nullable=False, index=True)  # ORIGIN_SPATIAL | TEMPORAL_WINDOW | DRIFT_ALIGNMENT | etc.

    weight = Column(Float, default=1.0)
    source = Column(String(100), default="MARS_EVIDENCE_ENGINE")
    timestamp = Column(DateTime(timezone=True), nullable=True)
    geometry = Column(GeoJSONGeometry(), nullable=True)
    data_quality = Column(Float, default=1.0)
    confidence = Column(Float, default=1.0)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    investigation = relationship("Investigation", back_populates="evidence_items")
    candidate_assessment = relationship("CandidateAssessment", back_populates="evidence_items")
