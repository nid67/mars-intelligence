"""
Abstract Base AIS Provider Interface.
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.app.providers.internal_models import AISRecord, VesselTrack


class AISProvider(ABC):
    @abstractmethod
    def search_vessels(
        self,
        bbox: List[float],
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict[str, Any]]:
        """Search vessels active within bounding box and time window."""
        pass

    @abstractmethod
    def get_tracks(
        self,
        mmsi: str,
        start_time: datetime,
        end_time: datetime
    ) -> VesselTrack:
        """Retrieve historical telemetry track for a specific vessel."""
        pass

    @abstractmethod
    def get_vessel_identity(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Lookup vessel registry identity by MMSI or IMO."""
        pass
