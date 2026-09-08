"""
Demonstration Environmental Provider.
Generates physically consistent ocean current vectors and atmospheric wind fields.
Strictly labeled DATA MODE: DEMONSTRATION.
"""
from typing import List
from datetime import datetime
import numpy as np
from backend.app.providers.base.environmental import EnvironmentalProvider
from backend.app.providers.internal_models import EnvironmentalField


class DemoEnvironmentalProvider(EnvironmentalProvider):
    def __init__(self, seed: int = 42):
        self.seed = seed

    def get_environmental_field(
        self,
        bbox: List[float],
        timestamp: datetime
    ) -> EnvironmentalField:
        min_lon, min_lat, max_lon, max_lat = bbox
        center_lon = (min_lon + max_lon) / 2.0
        center_lat = (min_lat + max_lat) / 2.0

        # Region-aware deterministic current and wind forcing
        # Arabian Sea (e.g. 68-75E, 15-22N)
        if 68.0 <= center_lon <= 77.0 and 12.0 <= center_lat <= 24.0:
            u_c, v_c = 0.12, -0.22    # Southward coastal current
            u_w, v_w = 3.8, -4.5     # NW breeze (~5.9 m/s)
            region_name = "Arabian Sea (West Coast)"
        # Bay of Bengal (e.g. 80-90E, 10-22N)
        elif 78.0 <= center_lon <= 90.0 and 10.0 <= center_lat <= 22.0:
            u_c, v_c = 0.28, 0.18     # East India Coastal Current (EICC)
            u_w, v_w = -2.5, 5.2     # Southerly / SW wind (~5.8 m/s)
            region_name = "Bay of Bengal (East Coast)"
        # Andaman Sea (e.g. 91-96E, 5-14N)
        elif 91.0 <= center_lon <= 98.0 and 4.0 <= center_lat <= 15.0:
            u_c, v_c = -0.32, 0.08    # Westward equatorial/strait flow
            u_w, v_w = -6.1, -2.2    # Easterly trade winds (~6.5 m/s)
            region_name = "Andaman Sea / Six Degree Channel"
        else:
            # Default arbitrary Indian ocean coordinates
            u_c, v_c = 0.15, -0.10
            u_w, v_w = 3.0, -3.0
            region_name = "Indian Maritime Domain"

        return EnvironmentalField(
            timestamp=timestamp,
            min_lon=min_lon,
            min_lat=min_lat,
            max_lon=max_lon,
            max_lat=max_lat,
            u_current=u_c,
            v_current=v_c,
            u_wind=u_w,
            v_wind=v_w,
            source="DEMONSTRATION",
            resolution="0.083 deg",
            wave_height_m=1.4,
            wave_direction_deg=220.0,
            metadata={
                "region": region_name,
                "data_mode": "DEMONSTRATION",
                "notice": "DATA MODE: DEMONSTRATION — Synthetic hydrodynamic forcing for SIH26143 demo"
            }
        )

    def get_currents(self, bbox: List[float], timestamp: datetime) -> EnvironmentalField:
        return self.get_environmental_field(bbox, timestamp)

    def get_wind(self, bbox: List[float], timestamp: datetime) -> EnvironmentalField:
        return self.get_environmental_field(bbox, timestamp)
