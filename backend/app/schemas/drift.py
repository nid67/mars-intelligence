"""
Drift Simulation Pydantic Schemas (Pydantic v2).
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class DriftRunCreate(BaseModel):
    investigation_id: str
    spill_detection_id: Optional[str] = None
    direction: str = Field(default="BACKWARD", json_schema_extra={"example": "BACKWARD"})
    duration_hours: float = Field(default=12.0, ge=1.0, le=72.0)
    time_step_seconds: int = Field(default=600, ge=60, le=3600)
    num_particles: int = Field(default=500, ge=50, le=5000)
    windage_factor: float = Field(default=0.032, ge=0.01, le=0.06)
    diffusion_coefficient: float = Field(default=2.5, ge=0.1, le=20.0)


class DriftRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    spill_detection_id: Optional[str] = None
    direction: str
    status: str
    simulation_start_time: datetime
    simulation_end_time: datetime
    duration_hours: float
    time_step_seconds: int
    num_particles: int
    windage_factor: float
    diffusion_coefficient: float
    environmental_data_source: str
    result_polygon: Optional[Dict[str, Any]] = None
    release_window_start: Optional[datetime] = None
    release_window_end: Optional[datetime] = None
    coastal_impact_proximity_km: Optional[float] = None
    uncertainty_radius_km: Optional[float] = None
    particle_trajectories: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
