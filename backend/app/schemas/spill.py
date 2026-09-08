"""
Potential Spill Pydantic Schemas (Pydantic v2).
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class SpillBase(BaseModel):
    investigation_id: str
    status: str = Field(default="potential", json_schema_extra={"example": "potential"})
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    look_alike_risk: float = Field(default=0.15, ge=0.0, le=1.0)
    look_alike_reasons: Optional[List[str]] = None
    polygon_geometry: Dict[str, Any]
    centroid: List[float] = Field(..., min_length=2, max_length=2, json_schema_extra={"example": [72.18, 19.12]})
    bbox: List[float] = Field(..., min_length=4, max_length=4)
    estimated_area_sqkm: float
    perimeter_km: float
    orientation_deg: float
    elongation: float
    connected_components_count: int = 1
    observation_timestamp: datetime
    detection_method: str = "ML_UNET_SEGMENTATION"
    model_metadata: Optional[Dict[str, Any]] = None


class SpillCreate(SpillBase):
    pass


class SpillUpdate(BaseModel):
    confidence: Optional[float] = None
    look_alike_risk: Optional[float] = None
    look_alike_reasons: Optional[List[str]] = None
    status: Optional[str] = None


class SpillResponse(SpillBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
