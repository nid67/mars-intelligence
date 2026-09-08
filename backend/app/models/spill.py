"""
Potential Spill Detection Table Model.
Adheres strictly to scientific non-certainty: records 'potential oil spill' with confidence and look-alike risk.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.types import GUID, GeoJSONGeometry


class SpillDetection(Base):
    __tablename__ = "spill_detections"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    investigation_id = Column(GUID(), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    satellite_observation_id = Column(GUID(), ForeignKey("satellite_observations.id", ondelete="SET NULL"), nullable=True)

    # Status is strictly 'potential' unless external authoritative record overrides
    status = Column(String(50), nullable=False, default="potential", index=True)
    confidence = Column(Float, nullable=False, default=0.85)  # 0.0 to 1.0
    look_alike_risk = Column(Float, nullable=False, default=0.15)  # 0.0 to 1.0
    look_alike_reasons = Column(JSON, nullable=True)  # List of factors e.g. ["low_wind_proximity", "wake_proximity"]

    # Geometry & Characterization
    polygon_geometry = Column(GeoJSONGeometry(), nullable=False)
    centroid = Column(JSON, nullable=False)  # [lon, lat]
    bbox = Column(JSON, nullable=False)  # [min_lon, min_lat, max_lon, max_lat]
    estimated_area_sqkm = Column(Float, nullable=False)
    perimeter_km = Column(Float, nullable=False)
    orientation_deg = Column(Float, nullable=False)  # Angle from North (0 - 180)
    elongation = Column(Float, nullable=False)  # Major axis / minor axis ratio
    connected_components_count = Column(Integer, default=1)

    observation_timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    detection_method = Column(String(100), default="ML_UNET_SEGMENTATION")
    model_metadata = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    investigation = relationship("Investigation", back_populates="spill_detections")
    satellite_observation = relationship("SatelliteObservation", back_populates="spill_detections")
    drift_runs = relationship("DriftRun", back_populates="spill_detection")
