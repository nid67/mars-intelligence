"""
Health & System Capabilities Pydantic Schemas.
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class ProviderStatus(BaseModel):
    configured: bool
    authenticated: bool
    reachable: bool
    status: str  # OPERATIONAL | MISSING_CREDENTIALS | UNREACHABLE | FALLBACK
    last_successful_request: Optional[datetime] = None
    error_reason: Optional[str] = None


class SystemCapabilitiesResponse(BaseModel):
    system_time: datetime
    active_data_mode: str
    database: Dict[str, Any]
    satellite: Dict[str, ProviderStatus]
    environmental: Dict[str, ProviderStatus]
    ais: Dict[str, ProviderStatus]
    ml: Dict[str, Any]
    sentinel_dataset: Optional[Dict[str, Any]] = None
    legal_neutrality_enforced: bool = True


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    timestamp: datetime
    database_connected: bool
    data_mode: str
