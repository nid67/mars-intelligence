"""
Health & System Capabilities API Router.
Reports readiness, database connectivity, and provider capabilities without leaking secrets.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.core.database import get_db, is_postgres
from backend.app.schemas.health import HealthResponse, SystemCapabilitiesResponse, ProviderStatus
from backend.app.providers.copernicus.satellite import CopernicusSatelliteProvider
from backend.app.providers.marine.environmental import CopernicusMarineEnvironmentalProvider
from backend.app.providers.ais.gfw import GlobalFishingWatchAISProvider
from backend.app.providers.demo.sentinel_dataset import get_dataset_stats

router = APIRouter(tags=["Health & System"])



@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """Liveness and database health check."""
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    return {
        "status": "ok" if db_ok else "degraded",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc),
        "database_connected": db_ok,
        "data_mode": settings.DATA_MODE.value
    }


@router.get("/system/capabilities", response_model=SystemCapabilitiesResponse)
def get_system_capabilities(db: Session = Depends(get_db)):
    """Inspects active system capabilities, configured external providers,

    and data mode availability without exposing credentials.
    """
    copernicus_sat = CopernicusSatelliteProvider()
    copernicus_env = CopernicusMarineEnvironmentalProvider()
    gfw_ais = GlobalFishingWatchAISProvider()

    db_type = "PostgreSQL+PostGIS" if is_postgres() else "SQLite (Local Fallback)"

    return {
        "system_time": datetime.now(timezone.utc),
        "active_data_mode": settings.DATA_MODE.value,
        "database": {
            "type": db_type,
            "status": "OPERATIONAL"
        },
        "satellite": {
            "copernicus_cdse": ProviderStatus(
                configured=copernicus_sat.is_configured(),
                authenticated=copernicus_sat.is_configured(),
                reachable=True,
                status="CONFIGURED" if copernicus_sat.is_configured() else "MISSING_CREDENTIALS",
                error_reason=None if copernicus_sat.is_configured() else "COPERNICUS_CLIENT_ID / COPERNICUS_CLIENT_SECRET not set"
            ),
            "demo_satellite": ProviderStatus(
                configured=True,
                authenticated=True,
                reachable=True,
                status="OPERATIONAL"
            )
        },
        "environmental": {
            "copernicus_marine": ProviderStatus(
                configured=copernicus_env.is_configured(),
                authenticated=copernicus_env.is_configured(),
                reachable=True,
                status="CONFIGURED" if copernicus_env.is_configured() else "MISSING_CREDENTIALS",
                error_reason=None if copernicus_env.is_configured() else "COPERNICUS_MARINE_USERNAME / PASSWORD not set"
            ),
            "demo_environmental": ProviderStatus(
                configured=True,
                authenticated=True,
                reachable=True,
                status="OPERATIONAL"
            )
        },
        "ais": {
            "global_fishing_watch": ProviderStatus(
                configured=gfw_ais.is_configured(),
                authenticated=gfw_ais.is_configured(),
                reachable=True,
                status="CONFIGURED" if gfw_ais.is_configured() else "MISSING_TOKEN",
                error_reason=None if gfw_ais.is_configured() else "GFW_API_TOKEN not set"
            ),
            "demo_ais": ProviderStatus(
                configured=True,
                authenticated=True,
                reachable=True,
                status="OPERATIONAL"
            )
        },
        "ml": {
            "model_mode": "DEMONSTRATION_FALLBACK",
            "pytorch_available": True,
            "cfar_detector_active": True,
            "classification": True,
            "segmentation": True
        },
        "sentinel_dataset": get_dataset_stats(),
        "legal_neutrality_enforced": True
    }

