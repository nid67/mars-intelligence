"""
GeoJSON Pydantic Schemas for GIS Interoperability.
Follows RFC 7946 specifications.
"""
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field


class GeoJSONGeometry(BaseModel):
    type: str = Field(..., example="Polygon")
    coordinates: Any


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: GeoJSONGeometry
    properties: Dict[str, Any] = Field(default_factory=dict)
    id: Optional[Union[str, int]] = None


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None


class CombinedMapResponse(BaseModel):
    investigation_id: str
    region: str
    observation_time: str
    bbox: List[float]
    layers: Dict[str, GeoJSONFeatureCollection]
