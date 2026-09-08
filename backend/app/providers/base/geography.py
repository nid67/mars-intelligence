"""
Abstract Base Geography & Coastal Provider Interface.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple
from backend.app.providers.internal_models import CoastlineData


class GeographyProvider(ABC):
    @abstractmethod
    def get_coastline(self, bbox: List[float]) -> CoastlineData:
        """Retrieve coastline geometry within the investigation bbox."""
        pass

    @abstractmethod
    def get_nearest_port(self, lon: float, lat: float) -> Tuple[str, float]:
        """Return (port_name, distance_km) for the given point."""
        pass

    @abstractmethod
    def is_land(self, lon: float, lat: float) -> bool:
        """Determine whether the specified coordinate is on land."""
        pass
