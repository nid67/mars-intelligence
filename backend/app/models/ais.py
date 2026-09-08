"""
AIS Position Table Model.
Records spatial-temporal telemetry with data quality and gap duration metrics.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.types import GUID


class AISPosition(Base):
    __tablename__ = "ais_positions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    vessel_id = Column(GUID(), ForeignKey("vessels.id", ondelete="CASCADE"), nullable=False, index=True)
    mmsi = Column(String(20), nullable=False, index=True)

    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_knots = Column(Float, nullable=True)
    course_deg = Column(Float, nullable=True)
    heading_deg = Column(Float, nullable=True)
    navigation_status = Column(String(100), default="UNDERWAY_USING_ENGINE")

    # Data Quality Indicators (Forensically Neutral)
    source = Column(String(100), default="DEMONSTRATION")  # GFW | DEMONSTRATION | TERRESTRIAL_AIS
    quality_score = Column(Float, default=1.0)  # 0.0 to 1.0
    gap_duration_hours = Column(Float, default=0.0)  # Time since previous broadcast

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    vessel = relationship("Vessel", back_populates="positions")

    __table_args__ = (
        Index("idx_ais_mmsi_timestamp", "mmsi", "timestamp"),
        Index("idx_ais_lat_lon", "latitude", "longitude"),
    )
