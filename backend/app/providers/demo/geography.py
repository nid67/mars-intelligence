"""
Demonstration Geography Provider.
Provides Indian coastline references, port locations, and coastal distance calculations.
"""
from typing import List, Dict, Any, Tuple
import math
from backend.app.providers.base.geography import GeographyProvider
from backend.app.providers.internal_models import CoastlineData

# Major and intermediate Indian maritime ports
INDIAN_PORTS = [
    {"name": "Jawaharlal Nehru Port (JNPT) / Mumbai", "lon": 72.95, "lat": 18.95},
    {"name": "Mumbai Port", "lon": 72.85, "lat": 18.93},
    {"name": "Deendayal Port (Kandla / Vadinar)", "lon": 70.22, "lat": 23.00},
    {"name": "Mormugao Port (Goa)", "lon": 73.80, "lat": 15.42},
    {"name": "New Mangalore Port", "lon": 74.82, "lat": 12.92},
    {"name": "Cochin Port", "lon": 76.27, "lat": 9.96},
    {"name": "V.O. Chidambaranar Port (Tuticorin)", "lon": 78.18, "lat": 8.75},
    {"name": "Chennai Port", "lon": 80.29, "lat": 13.08},
    {"name": "Kamarajar Port (Ennore)", "lon": 80.34, "lat": 13.26},
    {"name": "Visakhapatnam Port", "lon": 83.29, "lat": 17.69},
    {"name": "Paradip Port", "lon": 86.68, "lat": 20.26},
    {"name": "Syama Prasad Mookerjee Port (Kolkata/Haldia)", "lon": 88.08, "lat": 22.02},
    {"name": "Port Blair (Andaman)", "lon": 92.74, "lat": 11.67},
]


class DemoGeographyProvider(GeographyProvider):
    def get_coastline(self, bbox: List[float]) -> CoastlineData:
        min_lon, min_lat, max_lon, max_lat = bbox
        center_lon = (min_lon + max_lon) / 2.0
        center_lat = (min_lat + max_lat) / 2.0

        nearest_port, port_dist = self.get_nearest_port(center_lon, center_lat)

        # Approximate coastal reference line within AOI for map rendering
        coastline_geojson = {
            "type": "LineString",
            "coordinates": [
                [round(min_lon + 0.1, 4), round(min_lat, 4)],
                [round(center_lon + 0.05, 4), round(center_lat, 4)],
                [round(max_lon - 0.1, 4), round(max_lat, 4)]
            ]
        }

        return CoastlineData(
            geometry_geojson=coastline_geojson,
            nearest_distance_km=round(port_dist * 0.8, 1),
            port_proximity_km=round(port_dist, 1),
            nearest_port_name=nearest_port
        )

    def get_nearest_port(self, lon: float, lat: float) -> Tuple[str, float]:
        min_dist = float("inf")
        nearest_port_name = "Offshore Indian Ocean"

        for p in INDIAN_PORTS:
            # Haversine formula
            dlat = math.radians(p["lat"] - lat)
            dlon = math.radians(p["lon"] - lon)
            a = (math.sin(dlat / 2.0) ** 2 +
                 math.cos(math.radians(lat)) * math.cos(math.radians(p["lat"])) *
                 math.sin(dlon / 2.0) ** 2)
            c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
            dist_km = 6371.0 * c

            if dist_km < min_dist:
                min_dist = dist_km
                nearest_port_name = p["name"]

        return nearest_port_name, round(min_dist, 2)

    def is_land(self, lon: float, lat: float) -> bool:
        # Simple coarse bounding box for Indian subcontinent interior
        if 72.0 <= lon <= 88.0 and 8.0 <= lat <= 28.0:
            # Check rough proximity to ports
            _, dist = self.get_nearest_port(lon, lat)
            return dist < 1.0  # within 1km of port pier
        return False
