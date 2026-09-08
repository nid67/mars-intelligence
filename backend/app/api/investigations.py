"""
Investigation API Router.
Provides CRUD endpoints, 21-step pipeline runner, summary, report, and GIS map layers.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.exceptions import InvestigationNotFoundException
from backend.app.models.investigation import Investigation
from backend.app.schemas.investigation import (
    InvestigationCreate,
    InvestigationUpdate,
    InvestigationResponse
)
from backend.app.services.investigation_service import InvestigationPipelineService
from backend.app.services.gis_service import GISService
from backend.app.services.report_service import ReportService

router = APIRouter(prefix="/investigations", tags=["Investigations"])


@router.post("", response_model=InvestigationResponse, status_code=201)
def create_investigation(payload: InvestigationCreate, db: Session = Depends(get_db)):
    """Create a new maritime investigation."""
    inv = Investigation(
        name=payload.name,
        region=payload.region,
        data_mode=payload.data_mode,
        observation_time=payload.observation_time,
        bbox=payload.bbox,
        aoi_geometry=payload.aoi_geometry,
        description=payload.description,
        pipeline_params=payload.pipeline_params,
        status="CREATED"
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.get("", response_model=List[InvestigationResponse])
def list_investigations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    region: Optional[str] = None,
    data_mode: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all investigations with optional filtering."""
    query = db.query(Investigation)
    if region:
        query = query.filter(Investigation.region == region)
    if data_mode:
        query = query.filter(Investigation.data_mode == data_mode)
    return query.order_by(Investigation.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{id}", response_model=InvestigationResponse)
def get_investigation(id: str, db: Session = Depends(get_db)):
    """Retrieve details of a specific investigation."""
    inv = db.query(Investigation).filter(Investigation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{id}' not found.")
    return inv


@router.patch("/{id}", response_model=InvestigationResponse)
def update_investigation(id: str, payload: InvestigationUpdate, db: Session = Depends(get_db)):
    """Update investigation metadata."""
    inv = db.query(Investigation).filter(Investigation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{id}' not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(inv, field, value)

    db.commit()
    db.refresh(inv)
    return inv


@router.delete("/{id}", status_code=204)
def delete_investigation(id: str, db: Session = Depends(get_db)):
    """Delete an investigation and all associated artifacts."""
    inv = db.query(Investigation).filter(Investigation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{id}' not found.")
    db.delete(inv)
    db.commit()
    return None


@router.post("/{id}/run")
def run_investigation_pipeline(id: str, db: Session = Depends(get_db)):
    """Executes the complete 21-step forensic investigation pipeline:

    Detect -> Characterize -> Backtrack -> Origin -> AIS Correlation -> Attribution -> Evidence -> Uncertainty.
    """
    try:
        result = InvestigationPipelineService.run_pipeline(investigation_id=id, db=db)
        return result
    except InvestigationNotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution error: {str(e)}")


@router.get("/{id}/summary")
def get_investigation_summary(id: str, db: Session = Depends(get_db)):
    """Retrieve the executive investigation summary."""
    try:
        return ReportService.get_summary(investigation_id=id, db=db)
    except InvestigationNotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)


@router.get("/{id}/report")
def get_investigation_report(id: str, db: Session = Depends(get_db)):
    """Retrieve the complete forensic investigation dossier."""
    try:
        return ReportService.generate_report(investigation_id=id, db=db)
    except InvestigationNotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)


# GIS GeoJSON Endpoints
@router.get("/{id}/map")
def get_combined_map(id: str, db: Session = Depends(get_db)):
    """Retrieve combined GIS GeoJSON layers for map rendering."""
    try:
        return GISService.get_combined_map(investigation_id=id, db=db)
    except InvestigationNotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)


@router.get("/{id}/map/spill")
def get_map_spill(id: str, db: Session = Depends(get_db)):
    """Retrieve GeoJSON potential oil spill polygon and centroid layer."""
    return GISService.get_spill_layer(investigation_id=id, db=db)


@router.get("/{id}/map/origin")
def get_map_origin(id: str, db: Session = Depends(get_db)):
    """Retrieve GeoJSON probable origin region layer."""
    return GISService.get_origin_layer(investigation_id=id, db=db)


@router.get("/{id}/map/drift")
def get_map_drift(id: str, db: Session = Depends(get_db)):
    """Retrieve GeoJSON Lagrangian particle drift trajectories and forward forecasts."""
    return GISService.get_drift_layer(investigation_id=id, db=db)


@router.get("/{id}/map/vessels")
def get_map_vessels(id: str, db: Session = Depends(get_db)):
    """Retrieve GeoJSON candidate vessel tracks and marker positions."""
    return GISService.get_vessels_layer(investigation_id=id, db=db)


@router.get("/{id}/map/environment")
def get_map_environment(id: str, db: Session = Depends(get_db)):
    """Retrieve GeoJSON ocean current and atmospheric wind vector markers."""
    return GISService.get_environment_layer(investigation_id=id, db=db)
