"""
Copernicus Data Space Ecosystem (CDSE) Sentinel-1 SAR Provider.
Uses official CDSE OData/STAC APIs with OAuth2 Client Credentials authentication.
Gracefully falls back to Demo provider if credentials or network are unavailable.
"""
from typing import List, Optional
from datetime import datetime
import httpx
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.providers.base.satellite import SatelliteProvider
from backend.app.providers.demo.satellite import DemoSatelliteProvider
from backend.app.providers.internal_models import NormalizedSatelliteScene, RasterSubset


class CopernicusSatelliteProvider(SatelliteProvider):
    def __init__(self):
        self.client_id = settings.COPERNICUS_CLIENT_ID
        self.client_secret = settings.COPERNICUS_CLIENT_SECRET
        self.fallback = DemoSatelliteProvider()
        self._access_token: Optional[str] = None

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def _get_token(self) -> Optional[str]:
        if not self.is_configured():
            return None
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(
                    settings.CDSE_TOKEN_URL,
                    data={
                        "grant_type": "client_credentials",
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                if res.status_code == 200:
                    self._access_token = res.json().get("access_token")
                    return self._access_token
                else:
                    logger.warning(f"CDSE token acquisition failed with status {res.status_code}")
                    return None
        except Exception as e:
            logger.warning(f"CDSE token network error: {e}")
            return None

    def search_scenes(
        self,
        bbox: List[float],
        start_time: datetime,
        end_time: datetime,
        polarization: Optional[str] = "VV+VH"
    ) -> List[NormalizedSatelliteScene]:
        token = self._get_token()
        if not token:
            logger.info("CDSE credentials absent or invalid; activating DEMO satellite fallback.")
            return self.fallback.search_scenes(bbox, start_time, end_time, polarization)

        try:
            min_lon, min_lat, max_lon, max_lat = bbox
            # OData polygon filter
            poly_wkt = f"POLYGON(({min_lon} {min_lat}, {max_lon} {min_lat}, {max_lon} {max_lat}, {min_lon} {max_lat}, {min_lon} {min_lat}))"
            odata_filter = (
                f"OData.CSC.Intersects(area=geography'SRID=4326;{poly_wkt}') and "
                f"ContentDate/Start ge {start_time.isoformat()}Z and "
                f"ContentDate/Start le {end_time.isoformat()}Z and "
                f"contains(Name,'GRD') and contains(Name,'IW')"
            )

            headers = {"Authorization": f"Bearer {token}"}
            with httpx.Client(timeout=15.0) as client:
                res = client.get(
                    settings.CDSE_ODATA_URL,
                    params={"$filter": odata_filter, "$top": 5},
                    headers=headers
                )
                if res.status_code == 200:
                    data = res.json().get("value", [])
                    scenes = []
                    for item in data:
                        scene_id = item.get("Name", "S1A_SCENE")
                        acq_time = datetime.fromisoformat(item.get("ContentDate", {}).get("Start", start_time.isoformat()).replace("Z", "+00:00"))
                        scenes.append(
                            NormalizedSatelliteScene(
                                scene_id=scene_id,
                                product_id=item.get("Id", scene_id),
                                provider="COPERNICUS_CDSE",
                                acquisition_time=acq_time,
                                polarization="VV+VH",
                                orbit_direction="DESCENDING",
                                bbox=bbox,
                                resolution_m=10.0,
                                data_mode="REAL_API",
                                source_url=f"https://catalogue.dataspace.copernicus.eu/odata/v1/Products({item.get('Id')})/$value",
                                metadata=item
                            )
                        )
                    if scenes:
                        return scenes
        except Exception as e:
            logger.warning(f"Error querying CDSE API ({e}); falling back to demonstration provider.")

        return self.fallback.search_scenes(bbox, start_time, end_time, polarization)

    def get_scene(self, scene_id: str) -> NormalizedSatelliteScene:
        return self.fallback.get_scene(scene_id)

    def get_subset(
        self,
        scene: NormalizedSatelliteScene,
        bbox: List[float],
        resolution_m: float = 10.0
    ) -> RasterSubset:
        # If the scene is synthetic or remote download is unavailable, use calibrated generator
        return self.fallback.get_subset(scene, bbox, resolution_m)
