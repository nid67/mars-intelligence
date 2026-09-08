"""
Environmental Observation Table Model.
Stores ocean current vectors and atmospheric wind forcing data.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.types import GUID


class EnvironmentalObservation(Base):
    __tablename__ = "environmental_observations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    investigation_id = Column(GUID(), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)

    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Hydrodynamic Currents (m/s)
    u_current = Column(Float, nullable=False)  # Eastward current
    v_current = Column(Float, nullable=False)  # Northward current

    # Atmospheric 10m Winds (m/s)
    u_wind = Column(Float, nullable=False)  # Eastward wind
    v_wind = Column(Float, nullable=False)  # Northward wind

    # Optional oceanographic metrics
    wave_height_m = Column(Float, nullable=True)
    wave_direction_deg = Column(Float, nullable=True)
    sea_surface_temp_c = Column(Float, nullable=True)

    source = Column(String(100), default="DEMONSTRATION")  # COPERNICUS_MARINE | DEMONSTRATION
    dataset_id = Column(String(255), nullable=True)
    resolution = Column(String(50), default="0.083 deg")
    raw_metadata = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    investigation = relationship("Investigation", back_populates="environmental_observations")
