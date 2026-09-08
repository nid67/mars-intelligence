"""
Abstract Base Environmental Provider Interface.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
from backend.app.providers.internal_models import EnvironmentalField


class EnvironmentalProvider(ABC):
    @abstractmethod
    def get_currents(
        self,
        bbox: List[float],
        timestamp: datetime
    ) -> EnvironmentalField:
        """Retrieve ocean surface currents (u, v) for the requested AOI and timestamp."""
        pass

    @abstractmethod
    def get_wind(
        self,
        bbox: List[float],
        timestamp: datetime
    ) -> EnvironmentalField:
        """Retrieve 10m atmospheric wind vector (u, v) for the requested AOI and timestamp."""
        pass

    @abstractmethod
    def get_environmental_field(
        self,
        bbox: List[float],
        timestamp: datetime
    ) -> EnvironmentalField:
        """Retrieve combined surface currents and wind forcing."""
        pass
