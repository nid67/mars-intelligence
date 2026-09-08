"""
Data Sources & Transparency API Router.
Provides endpoints to audit data provenance, sensor resolution, and licensing.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.datasource import DataSource

router = APIRouter(prefix="/data", tags=["Data Sources"])


@router.get("/sources")
def list_data_sources(
    investigation_id: Optional[str] = None,
    provider: Optional[str] = None,
    data_mode: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List data sources used across investigations with transparency classification."""
    query = db.query(DataSource)
    if investigation_id:
        query = query.filter(DataSource.investigation_id == investigation_id)
    if provider:
        query = query.filter(DataSource.provider == provider)
    if data_mode:
        query = query.filter(DataSource.data_mode == data_mode)

    records = query.order_by(DataSource.query_time.desc()).all()
    return [
        {
            "id": str(r.id),
            "investigation_id": str(r.investigation_id) if r.investigation_id else None,
            "provider": r.provider,
            "dataset_name": r.dataset_name,
            "dataset_version": r.dataset_version,
            "query_time": r.query_time.isoformat(),
            "observation_time": r.observation_time.isoformat() if r.observation_time else None,
            "source_identifier": r.source_identifier,
            "data_mode": r.data_mode,
            "spatial_resolution": r.spatial_resolution,
            "license": r.license_metadata,
            "status": r.status
        }
        for r in records
    ]
