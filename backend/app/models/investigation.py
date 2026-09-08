"""
Investigation Table Model.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.types import GUID, GeoJSONGeometry


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    region = Column(String(100), nullable=False, index=True)
    data_mode = Column(String(50), nullable=False, default="DEMONSTRATION")  # DEMONSTRATION | REAL_API | HYBRID
    status = Column(String(50), nullable=False, default="CREATED", index=True)  # CREATED | PROCESSING | COMPLETED | FAILED
    observation_time = Column(DateTime(timezone=True), nullable=False, index=True)

    # Bounding box coordinates: [min_lon, min_lat, max_lon, max_lat]
    bbox = Column(JSON, nullable=False)
    # Area of Interest polygon geometry
    aoi_geometry = Column(GeoJSONGeometry(), nullable=True)

    # Summary and configuration
    description = Column(String(1000), nullable=True)
    pipeline_params = Column(JSON, nullable=True)
    executive_summary = Column(JSON, nullable=True)
    structured_uncertainty = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    satellite_observations = relationship("SatelliteObservation", back_populates="investigation", cascade="all, delete-orphan")
    spill_detections = relationship("SpillDetection", back_populates="investigation", cascade="all, delete-orphan")
    environmental_observations = relationship("EnvironmentalObservation", back_populates="investigation", cascade="all, delete-orphan")
    drift_runs = relationship("DriftRun", back_populates="investigation", cascade="all, delete-orphan")
    candidate_assessments = relationship("CandidateAssessment", back_populates="investigation", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="investigation", cascade="all, delete-orphan")
    model_runs = relationship("ModelRun", back_populates="investigation", cascade="all, delete-orphan")
