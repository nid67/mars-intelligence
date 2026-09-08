"""
Vessel Catalog Table Model.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, Integer
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.types import GUID


class Vessel(Base):
    __tablename__ = "vessels"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    mmsi = Column(String(20), unique=True, nullable=False, index=True)
    imo = Column(String(20), nullable=True, index=True)
    name = Column(String(255), nullable=False, default="UNKNOWN VESSEL", index=True)
    vessel_type = Column(String(100), nullable=False, default="UNKNOWN", index=True)
    flag = Column(String(10), nullable=True)
    callsign = Column(String(20), nullable=True)
    length_m = Column(Float, nullable=True)
    width_m = Column(Float, nullable=True)
    gross_tonnage = Column(Float, nullable=True)
    source = Column(String(100), default="AIS_FEED")

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    positions = relationship("AISPosition", back_populates="vessel", cascade="all, delete-orphan")
    assessments = relationship("CandidateAssessment", back_populates="vessel", cascade="all, delete-orphan")
