"""
Model Run Audit Table Model.
Tracks ML model provenance, architecture versions, inference timestamps, and detection parameters.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.types import GUID


class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    investigation_id = Column(GUID(), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)

    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), default="1.0.0")
    model_mode = Column(String(50), default="DEMONSTRATION_FALLBACK")  # ML | DEMONSTRATION_FALLBACK
    task_type = Column(String(50), default="SEGMENTATION")  # CLASSIFICATION | SEGMENTATION

    inference_duration_ms = Column(Float, default=0.0)
    parameters = Column(JSON, nullable=True)
    metrics_summary = Column(JSON, nullable=True)
    status = Column(String(50), default="SUCCESS")

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    investigation = relationship("Investigation", back_populates="model_runs")
