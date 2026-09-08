"""
Evidence API Router.
Provides CRUD endpoints for supporting and contradicting evidence items.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.evidence import Evidence
from backend.app.schemas.evidence import EvidenceCreate, EvidenceUpdate, EvidenceResponse

router = APIRouter(prefix="/evidence", tags=["Evidence"])


@router.post("", response_model=EvidenceResponse, status_code=201)
def create_evidence_item(payload: EvidenceCreate, db: Session = Depends(get_db)):
    """Create a new evidentiary item."""
    ev = Evidence(
        investigation_id=payload.investigation_id,
        candidate_assessment_id=payload.candidate_assessment_id,
        title=payload.title,
        description=payload.description,
        direction=payload.direction,
        factor=payload.factor,
        weight=payload.weight,
        source=payload.source,
        timestamp=payload.timestamp,
        geometry=payload.geometry,
        data_quality=payload.data_quality,
        confidence=payload.confidence
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.get("", response_model=List[EvidenceResponse])
def list_evidence_items(
    investigation_id: Optional[str] = None,
    candidate_assessment_id: Optional[str] = None,
    direction: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List evidentiary items."""
    query = db.query(Evidence)
    if investigation_id:
        query = query.filter(Evidence.investigation_id == investigation_id)
    if candidate_assessment_id:
        query = query.filter(Evidence.candidate_assessment_id == candidate_assessment_id)
    if direction:
        query = query.filter(Evidence.direction == direction.upper())
    return query.order_by(Evidence.created_at.desc()).all()


@router.get("/{id}", response_model=EvidenceResponse)
def get_evidence_item(id: str, db: Session = Depends(get_db)):
    """Retrieve details of an evidentiary item."""
    ev = db.query(Evidence).filter(Evidence.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail=f"Evidence item '{id}' not found.")
    return ev


@router.patch("/{id}", response_model=EvidenceResponse)
def update_evidence_item(id: str, payload: EvidenceUpdate, db: Session = Depends(get_db)):
    """Update evidence item weight or description."""
    ev = db.query(Evidence).filter(Evidence.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail=f"Evidence item '{id}' not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ev, field, value)

    db.commit()
    db.refresh(ev)
    return ev


@router.delete("/{id}", status_code=204)
def delete_evidence_item(id: str, db: Session = Depends(get_db)):
    """Delete an evidentiary item."""
    ev = db.query(Evidence).filter(Evidence.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail=f"Evidence item '{id}' not found.")
    db.delete(ev)
    db.commit()
    return None
