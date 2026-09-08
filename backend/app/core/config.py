"""
Core Configuration Module for MARS.
Loads configuration from environment variables and .env with Pydantic Settings v2.
"""
from enum import Enum
from typing import List, Dict
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class DataMode(str, Enum):
    DEMONSTRATION = "DEMONSTRATION"
    REAL_API = "REAL_API"
    HYBRID = "HYBRID"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Application
    PROJECT_NAME: str = "MARS — Maritime Intelligence & Forensic Investigation Platform"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["*"]

    # Data Mode
    DATA_MODE: DataMode = DataMode.DEMONSTRATION

    # Database
    DATABASE_URL: str = "sqlite:///./data/mars_local.db"
    SQLITE_FALLBACK_DB: str = "data/mars_local.db"

    # ML & Inference
    MODEL_PATH: str = "models/"
    INFERENCE_DEVICE: str = "cpu"
    CONFIDENCE_THRESHOLD: float = 0.50
    LOOK_ALIKE_MAX_TOLERANCE: float = 0.70

    # Local Cache
    CACHE_DIR: str = "cache/"

    # Copernicus Data Space Ecosystem (CDSE) Sentinel-1
    COPERNICUS_CLIENT_ID: str = ""
    COPERNICUS_CLIENT_SECRET: str = ""
    CDSE_TOKEN_URL: str = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    CDSE_ODATA_URL: str = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"

    # Copernicus Marine Service (CMEMS)
    COPERNICUS_MARINE_USERNAME: str = ""
    COPERNICUS_MARINE_PASSWORD: str = ""
    COPERNICUS_MARINE_CURRENT_DATASET: str = "cmems_mod_glo_phy_anfc_0.083deg_P1D-m"
    COPERNICUS_MARINE_WIND_DATASET: str = "cmems_obs-wind_glo_phy_my_l4_0.125deg_P1D"

    # Global Fishing Watch (GFW)
    GFW_API_TOKEN: str = ""
    GFW_BASE_URL: str = "https://gateway.globalfishingwatch.org/v3/"

    # Geography & Region
    DEFAULT_REGION: str = "INDIAN_MARITIME_DOMAIN"

    # Lagrangian Drift Defaults
    DRIFT_DEFAULT_PARTICLES: int = 500
    DRIFT_DEFAULT_WINDAGE: float = 0.032
    DRIFT_DEFAULT_DIFFUSION: float = 2.5
    DRIFT_BACKWARD_WINDOWS_HOURS: List[int] = [2, 4, 6, 8, 12, 18, 24]
    DRIFT_FORWARD_WINDOWS_HOURS: List[int] = [6, 12, 24]

    # Attribution Configurable Weights (Must sum to 1.00)
    ATTRIBUTION_WEIGHTS: Dict[str, float] = {
        "origin_compatibility": 0.25,
        "temporal_compatibility": 0.20,
        "drift_compatibility": 0.20,
        "trajectory_compatibility": 0.15,
        "vessel_type": 0.05,
        "ais_quality": 0.05,
        "trajectory_behavior": 0.05,
        "evidence_quality": 0.05,
    }


settings = Settings()
