"""
Candidate Assessment Table Model.
Stores explainable attribution score (0-100) and multi-factor breakdown.
Adheres strictly to scientific neutrality: never claims guilt or legal liability.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.types import GUID


class CandidateAssessment(Base):
    __tablename__ = "candidate_assessments"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    investigation_id = Column(GUID(), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    vessel_id = Column(GUID(), ForeignKey("vessels.id", ondelete="CASCADE"), nullable=False, index=True)

    # Attribution metrics (0.0 to 100.0)
    attribution_score = Column(Float, nullable=False, index=True)
    candidate_rank = Column(Integer, nullable=False, default=1)
    investigation_priority = Column(String(50), default="MEDIUM")  # HIGH | MEDIUM | LOW | MONITORING

    # Detailed Sub-Scores (each 0.0 to 1.0)
    origin_compatibility_score = Column(Float, default=0.0)
    temporal_compatibility_score = Column(Float, default=0.0)
    drift_compatibility_score = Column(Float, default=0.0)
    trajectory_compatibility_score = Column(Float, default=0.0)
    vessel_type_score = Column(Float, default=0.0)
    ais_quality_score = Column(Float, default=1.0)
    behavior_anomaly_score = Column(Float, default=0.0)
    evidence_quality_score = Column(Float, default=1.0)

    # Weight configuration applied
    applied_weights = Column(JSON, nullable=True)

    # Summary forensic evaluation
    forensic_summary = Column(String(1000), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    investigation = relationship("Investigation", back_populates="candidate_assessments")
    vessel = relationship("Vessel", back_populates="assessments")
    evidence_items = relationship("Evidence", back_populates="candidate_assessment", cascade="all, delete-orphan")
