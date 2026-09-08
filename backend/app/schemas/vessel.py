"""
Vessel & AIS Pydantic Schemas (Pydantic v2).
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class VesselBase(BaseModel):
    mmsi: str = Field(..., json_schema_extra={"example": "419000101"})
    imo: Optional[str] = Field(None, json_schema_extra={"example": "9382011"})
    name: str = Field(default="UNKNOWN VESSEL", json_schema_extra={"example": "OCEAN VOYAGER"})
    vessel_type: str = Field(default="UNKNOWN", json_schema_extra={"example": "CRUDE_OIL_TANKER"})
    flag: Optional[str] = Field(None, json_schema_extra={"example": "IN"})
    callsign: Optional[str] = None
    length_m: Optional[float] = None
    width_m: Optional[float] = None
    gross_tonnage: Optional[float] = None
    source: str = "AIS_FEED"


class VesselCreate(VesselBase):
    pass


class VesselUpdate(BaseModel):
    name: Optional[str] = None
    vessel_type: Optional[str] = None
    flag: Optional[str] = None
    gross_tonnage: Optional[float] = None


class VesselResponse(VesselBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class AISPositionBase(BaseModel):
    mmsi: str
    timestamp: datetime
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    speed_knots: Optional[float] = None
    course_deg: Optional[float] = None
    heading_deg: Optional[float] = None
    navigation_status: Optional[str] = "UNDERWAY_USING_ENGINE"
    source: str = "DEMONSTRATION"
    quality_score: float = 1.0
    gap_duration_hours: float = 0.0


class AISPositionCreate(AISPositionBase):
    vessel_id: Optional[str] = None


class AISPositionResponse(AISPositionBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    vessel_id: str
    created_at: datetime


class VesselTrackResponse(BaseModel):
    vessel: VesselResponse
    track_length_km: float
    total_positions: int
    avg_speed_knots: float
    max_speed_knots: float
    detected_gaps_count: int
    max_gap_duration_hours: float
    geojson_linestring: Dict[str, Any]
    positions: List[AISPositionResponse]
