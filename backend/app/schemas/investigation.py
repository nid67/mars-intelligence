"""
Investigation Pydantic Schemas (Pydantic v2).
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class InvestigationBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Offshore Mumbai Transit Corridor Investigation"})
    region: str = Field(..., json_schema_extra={"example": "Arabian Sea"})
    data_mode: str = Field(default="DEMONSTRATION", json_schema_extra={"example": "DEMONSTRATION"})
    observation_time: datetime = Field(...)
    bbox: List[float] = Field(..., min_length=4, max_length=4, json_schema_extra={"example": [71.5, 18.5, 72.8, 19.8]})
    aoi_geometry: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    pipeline_params: Optional[Dict[str, Any]] = None


class InvestigationCreate(InvestigationBase):
    pass


class InvestigationUpdate(BaseModel):
    name: Optional[str] = None
    region: Optional[str] = None
    data_mode: Optional[str] = None
    status: Optional[str] = None
    observation_time: Optional[datetime] = None
    bbox: Optional[List[float]] = None
    aoi_geometry: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    pipeline_params: Optional[Dict[str, Any]] = None


class InvestigationResponse(InvestigationBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    executive_summary: Optional[Dict[str, Any]] = None
    structured_uncertainty: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
