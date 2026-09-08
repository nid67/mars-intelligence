"""
Custom SQLAlchemy Types for Cross-Platform Geospatial and UUID Storage.
"""
import uuid
import json
from typing import Optional, Any
from sqlalchemy import TypeDecorator, String, Text, JSON


class GUID(TypeDecorator):
    """Platform-independent GUID/UUID type.
    Uses native UUID on PostgreSQL, CHAR(36) on SQLite.
    """
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        elif isinstance(value, uuid.UUID):
            return str(value)
        return str(uuid.UUID(str(value)))

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return str(value)


class GeoJSONGeometry(TypeDecorator):
    """GeoJSON Geometry TypeDecorator.
    Stores and retrieves GeoJSON geometry dictionary cleanly across SQLite and PostgreSQL.
    """
    impl = JSON
    cache_ok = True

    def process_bind_param(self, value: Any, dialect: Any) -> Optional[str]:
        if value is None:
            return None
        if isinstance(value, (dict, list)):
            return value
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return {"type": "Unknown", "value": value}
        return value

    def process_result_value(self, value: Any, dialect: Any) -> Optional[dict]:
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return None
        return value
