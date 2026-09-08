"""
Data Source Transparency Table Model.
Preserves data provenance, provider credentials usage, mode, and licensing metadata.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON
from backend.app.core.database import Base
from backend.app.models.types import GUID


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    investigation_id = Column(GUID(), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=True, index=True)

    provider = Column(String(100), nullable=False)  # COPERNICUS_CDSE | COPERNICUS_MARINE | GFW | DEMONSTRATION
    dataset_name = Column(String(255), nullable=False)
    dataset_version = Column(String(50), nullable=True)

    query_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    observation_time = Column(DateTime(timezone=True), nullable=True)
    source_identifier = Column(String(255), nullable=True)

    # Transparency Classification: REAL | DEMONSTRATION | SYNTHETIC | CURATED_HISTORICAL
    data_mode = Column(String(50), nullable=False, default="DEMONSTRATION")
    spatial_resolution = Column(String(50), nullable=True)
    license_metadata = Column(String(255), nullable=True)
    status = Column(String(50), default="AVAILABLE")
    details = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
