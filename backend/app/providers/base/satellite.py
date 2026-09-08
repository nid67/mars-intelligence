"""
Abstract Base Satellite Provider Interface.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
from backend.app.providers.internal_models import NormalizedSatelliteScene, RasterSubset


class SatelliteProvider(ABC):
    @abstractmethod
    def search_scenes(
        self,
        bbox: List[float],
        start_time: datetime,
        end_time: datetime,
        polarization: Optional[str] = None
    ) -> List[NormalizedSatelliteScene]:
        """Search Sentinel-1 SAR scenes within bounding box and time window."""
        pass

    @abstractmethod
    def get_scene(self, scene_id: str) -> NormalizedSatelliteScene:
        """Retrieve scene metadata by identifier."""
        pass

    @abstractmethod
    def get_subset(
        self,
        scene: NormalizedSatelliteScene,
        bbox: List[float],
        resolution_m: float = 10.0
    ) -> RasterSubset:
        """Extract cropped raster array (backscatter in dB) for the given AOI."""
        pass
