"""
Normalized Internal Domain Models for External Providers.
The core engines consume these models exclusively, remaining decoupled from third-party APIs.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Any, Optional
import numpy as np


@dataclass
class NormalizedSatelliteScene:
    scene_id: str
    product_id: str
    provider: str  # COPERNICUS_CDSE | DEMONSTRATION
    acquisition_time: datetime
    polarization: str
    orbit_direction: str
    bbox: List[float]  # [min_lon, min_lat, max_lon, max_lat]
    resolution_m: float
    data_mode: str
    source_url: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RasterSubset:
    scene_id: str
    bbox: List[float]
    width: int
    height: int
    data: np.ndarray  # 2D array of normalized backscatter values (dB or linear)
    resolution_m: float
    crs: str = "EPSG:4326"
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EnvironmentalField:
    timestamp: datetime
    min_lon: float
    min_lat: float
    max_lon: float
    max_lat: float
    u_current: float  # m/s eastward current
    v_current: float  # m/s northward current
    u_wind: float     # m/s eastward wind
    v_wind: float     # m/s northward wind
    source: str       # COPERNICUS_MARINE | DEMONSTRATION
    resolution: str
    wave_height_m: Optional[float] = None
    wave_direction_deg: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AISRecord:
    mmsi: str
    imo: Optional[str]
    vessel_name: str
    vessel_type: str
    flag: Optional[str]
    timestamp: datetime
    latitude: float
    longitude: float
    speed_knots: float
    course_deg: float
    heading_deg: float
    navigation_status: str
    source: str
    quality_score: float = 1.0
    gap_duration_hours: float = 0.0


@dataclass
class VesselTrack:
    vessel_mmsi: str
    vessel_name: str
    vessel_type: str
    positions: List[AISRecord]
    track_length_km: float
    avg_speed_knots: float
    max_speed_knots: float
    detected_gaps: int
    max_gap_hours: float
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CoastlineData:
    geometry_geojson: Dict[str, Any]
    nearest_distance_km: float
    port_proximity_km: Optional[float] = None
    nearest_port_name: Optional[str] = None
