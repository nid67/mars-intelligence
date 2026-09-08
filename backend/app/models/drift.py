"""
Lagrangian Drift Simulation Table Model.
Stores parameters and trajectory ensembles for both backward backtracking and forward forecasting.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.types import GUID, GeoJSONGeometry


class DriftRun(Base):
    __tablename__ = "drift_runs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    investigation_id = Column(GUID(), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    spill_detection_id = Column(GUID(), ForeignKey("spill_detections.id", ondelete="SET NULL"), nullable=True, index=True)

    direction = Column(String(20), nullable=False)  # BACKWARD | FORWARD
    status = Column(String(50), default="COMPLETED")

    simulation_start_time = Column(DateTime(timezone=True), nullable=False)
    simulation_end_time = Column(DateTime(timezone=True), nullable=False)
    duration_hours = Column(Float, nullable=False)
    time_step_seconds = Column(Integer, default=600)
    num_particles = Column(Integer, default=500)

    # Physical Forcing Parameters
    windage_factor = Column(Float, default=0.032)
    diffusion_coefficient = Column(Float, default=2.5)
    environmental_data_source = Column(String(100), default="DEMONSTRATION")

    # Outputs
    # Probable Origin Region (for backward drift) or Forecast Spread (for forward drift)
    result_polygon = Column(GeoJSONGeometry(), nullable=True)
    # Temporal window of release
    release_window_start = Column(DateTime(timezone=True), nullable=True)
    release_window_end = Column(DateTime(timezone=True), nullable=True)

    # Detailed particle endpoints / trajectory summary
    particle_trajectories = Column(JSON, nullable=True)
    # Proximity metrics
    coastal_impact_proximity_km = Column(Float, nullable=True)
    uncertainty_radius_km = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    investigation = relationship("Investigation", back_populates="drift_runs")
    spill_detection = relationship("SpillDetection", back_populates="drift_runs")
