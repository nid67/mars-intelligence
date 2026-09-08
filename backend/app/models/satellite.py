"""
Satellite Observation Table Model.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.types import GUID, GeoJSONGeometry


class SatelliteObservation(Base):
    __tablename__ = "satellite_observations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    investigation_id = Column(GUID(), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)

    provider = Column(String(100), nullable=False)  # COPERNICUS_CDSE | DEMONSTRATION
    data_mode = Column(String(50), nullable=False, default="DEMONSTRATION")
    scene_id = Column(String(255), nullable=False, index=True)
    product_type = Column(String(50), default="GRD")
    instrument = Column(String(50), default="C-SAR")
    sensor = Column(String(50), default="SENTINEL-1")
    polarization = Column(String(20), default="VV+VH")
    orbit_direction = Column(String(20), default="DESCENDING")

    acquisition_time = Column(DateTime(timezone=True), nullable=False, index=True)
    bbox = Column(JSON, nullable=False)
    footprint = Column(GeoJSONGeometry(), nullable=True)
    resolution_m = Column(Float, default=10.0)

    source_url = Column(String(500), nullable=True)
    raw_metadata = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    investigation = relationship("Investigation", back_populates="satellite_observations")
    spill_detections = relationship("SpillDetection", back_populates="satellite_observation")
