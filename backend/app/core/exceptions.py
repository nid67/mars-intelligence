"""
Domain Exceptions for MARS Forensic Platform.
"""
from typing import Optional, Dict, Any


class MARSException(Exception):
    """Base exception for all MARS domain errors."""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class InvestigationNotFoundException(MARSException):
    def __init__(self, investigation_id: str):
        super().__init__(
            message=f"Investigation with ID '{investigation_id}' was not found.",
            status_code=404,
            details={"investigation_id": investigation_id}
        )


class SpillNotFoundException(MARSException):
    def __init__(self, spill_id: str):
        super().__init__(
            message=f"Potential spill record with ID '{spill_id}' was not found.",
            status_code=404,
            details={"spill_id": spill_id}
        )


class VesselNotFoundException(MARSException):
    def __init__(self, vessel_id: str):
        super().__init__(
            message=f"Vessel with identifier '{vessel_id}' was not found.",
            status_code=404,
            details={"vessel_id": vessel_id}
        )


class InvalidGeometryException(MARSException):
    def __init__(self, reason: str, geometry_data: Any = None):
        super().__init__(
            message=f"Invalid geospatial geometry: {reason}",
            status_code=422,
            details={"reason": reason, "geometry": str(geometry_data)}
        )


class ProviderException(MARSException):
    def __init__(self, provider_name: str, reason: str, fallback_available: bool = True):
        super().__init__(
            message=f"External provider '{provider_name}' error: {reason}",
            status_code=502,
            details={"provider": provider_name, "reason": reason, "fallback_available": fallback_available}
        )


class DriftSimulationException(MARSException):
    def __init__(self, reason: str):
        super().__init__(
            message=f"Lagrangian drift simulation failed: {reason}",
            status_code=500,
            details={"reason": reason}
        )
