"""
Spill Detection API Router.
Provides CRUD endpoints for potential oil spill detections and characterization metrics.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.spill import SpillDetection
from backend.app.schemas.spill import SpillCreate, SpillUpdate, SpillResponse

router = APIRouter(prefix="/spills", tags=["Spills"])


@router.post("", response_model=SpillResponse, status_code=201)
def create_spill(payload: SpillCreate, db: Session = Depends(get_db)):
    """Record a potential oil spill detection."""
    spill = SpillDetection(
        investigation_id=payload.investigation_id,
        status="potential",
        confidence=payload.confidence,
        look_alike_risk=payload.look_alike_risk,
        look_alike_reasons=payload.look_alike_reasons,
        polygon_geometry=payload.polygon_geometry,
        centroid=payload.centroid,
        bbox=payload.bbox,
        estimated_area_sqkm=payload.estimated_area_sqkm,
        perimeter_km=payload.perimeter_km,
        orientation_deg=payload.orientation_deg,
        elongation=payload.elongation,
        connected_components_count=payload.connected_components_count,
        observation_timestamp=payload.observation_timestamp,
        detection_method=payload.detection_method,
        model_metadata=payload.model_metadata
    )
    db.add(spill)
    db.commit()
    db.refresh(spill)
    return spill


@router.get("", response_model=List[SpillResponse])
def list_spills(
    investigation_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List potential oil spills."""
    query = db.query(SpillDetection)
    if investigation_id:
        query = query.filter(SpillDetection.investigation_id == investigation_id)
    return query.order_by(SpillDetection.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{id}", response_model=SpillResponse)
def get_spill(id: str, db: Session = Depends(get_db)):
    """Retrieve details of a specific spill detection."""
    spill = db.query(SpillDetection).filter(SpillDetection.id == id).first()
    if not spill:
        raise HTTPException(status_code=404, detail=f"Spill record '{id}' not found.")
    return spill


@router.patch("/{id}", response_model=SpillResponse)
def update_spill(id: str, payload: SpillUpdate, db: Session = Depends(get_db)):
    """Update spill evaluation attributes."""
    spill = db.query(SpillDetection).filter(SpillDetection.id == id).first()
    if not spill:
        raise HTTPException(status_code=404, detail=f"Spill record '{id}' not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(spill, field, value)

    db.commit()
    db.refresh(spill)
    return spill


@router.delete("/{id}", status_code=204)
def delete_spill(id: str, db: Session = Depends(get_db)):
    """Delete a spill record."""
    spill = db.query(SpillDetection).filter(SpillDetection.id == id).first()
    if not spill:
        raise HTTPException(status_code=404, detail=f"Spill record '{id}' not found.")
    db.delete(spill)
    db.commit()
    return None
