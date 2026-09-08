"""
Provider Factory Module.
Instantiates and configures providers based on the requested DataMode:
- DEMONSTRATION: Fully deterministic synthetic providers
- REAL_API: Copernicus CDSE + Copernicus Marine + Global Fishing Watch
- HYBRID: Real Sentinel-1 & Marine environment paired with curated/demo AIS
"""
from backend.app.core.config import DataMode
from backend.app.providers.base.satellite import SatelliteProvider
from backend.app.providers.base.environmental import EnvironmentalProvider
from backend.app.providers.base.ais import AISProvider
from backend.app.providers.base.geography import GeographyProvider
from backend.app.providers.demo.satellite import DemoSatelliteProvider
from backend.app.providers.demo.environmental import DemoEnvironmentalProvider
from backend.app.providers.demo.ais import DemoAISProvider
from backend.app.providers.demo.geography import DemoGeographyProvider
from backend.app.providers.copernicus.satellite import CopernicusSatelliteProvider
from backend.app.providers.marine.environmental import CopernicusMarineEnvironmentalProvider
from backend.app.providers.ais.gfw import GlobalFishingWatchAISProvider


class ProviderFactory:
    @staticmethod
    def get_satellite_provider(mode: str) -> SatelliteProvider:
        if mode in [DataMode.REAL_API.value, DataMode.HYBRID.value]:
            return CopernicusSatelliteProvider()
        return DemoSatelliteProvider()

    @staticmethod
    def get_environmental_provider(mode: str) -> EnvironmentalProvider:
        if mode in [DataMode.REAL_API.value, DataMode.HYBRID.value]:
            return CopernicusMarineEnvironmentalProvider()
        return DemoEnvironmentalProvider()

    @staticmethod
    def get_ais_provider(mode: str) -> AISProvider:
        if mode == DataMode.REAL_API.value:
            return GlobalFishingWatchAISProvider()
        # HYBRID or DEMONSTRATION uses DemoAISProvider for guaranteed deterministic safety
        return DemoAISProvider()

    @staticmethod
    def get_geography_provider(mode: str) -> GeographyProvider:
        return DemoGeographyProvider()
