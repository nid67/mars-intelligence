"""
Vessel Catalog API Router.
Provides CRUD endpoints for maritime vessels and track reconstruction.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.vessel import Vessel
from backend.app.models.ais import AISPosition
from backend.app.schemas.vessel import VesselCreate, VesselUpdate, VesselResponse, VesselTrackResponse
from backend.app.engines.ais_reconstruction import AISTrajectoryReconstructor
from backend.app.providers.internal_models import AISRecord

router = APIRouter(prefix="/vessels", tags=["Vessels"])


@router.post("", response_model=VesselResponse, status_code=201)
def create_vessel(payload: VesselCreate, db: Session = Depends(get_db)):
    """Register a new vessel in the catalog."""
    existing = db.query(Vessel).filter(Vessel.mmsi == payload.mmsi).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Vessel with MMSI '{payload.mmsi}' already exists.")

    vessel = Vessel(
        mmsi=payload.mmsi,
        imo=payload.imo,
        name=payload.name,
        vessel_type=payload.vessel_type,
        flag=payload.flag,
        callsign=payload.callsign,
        length_m=payload.length_m,
        width_m=payload.width_m,
        gross_tonnage=payload.gross_tonnage,
        source=payload.source
    )
    db.add(vessel)
    db.commit()
    db.refresh(vessel)
    return vessel


@router.get("", response_model=List[VesselResponse])
def list_vessels(
    vessel_type: Optional[str] = None,
    flag: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List registered vessels."""
    query = db.query(Vessel)
    if vessel_type:
        query = query.filter(Vessel.vessel_type == vessel_type)
    if flag:
        query = query.filter(Vessel.flag == flag)
    return query.offset(skip).limit(limit).all()


@router.get("/{id}", response_model=VesselResponse)
def get_vessel(id: str, db: Session = Depends(get_db)):
    """Retrieve details of a specific vessel."""
    vessel = db.query(Vessel).filter((Vessel.id == id) | (Vessel.mmsi == id)).first()
    if not vessel:
        raise HTTPException(status_code=404, detail=f"Vessel '{id}' not found.")
    return vessel


@router.patch("/{id}", response_model=VesselResponse)
def update_vessel(id: str, payload: VesselUpdate, db: Session = Depends(get_db)):
    """Update vessel details."""
    vessel = db.query(Vessel).filter(Vessel.id == id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail=f"Vessel '{id}' not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vessel, field, value)

    db.commit()
    db.refresh(vessel)
    return vessel


@router.delete("/{id}", status_code=204)
def delete_vessel(id: str, db: Session = Depends(get_db)):
    """Delete a vessel and its position history."""
    vessel = db.query(Vessel).filter(Vessel.id == id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail=f"Vessel '{id}' not found.")
    db.delete(vessel)
    db.commit()
    return None


@router.get("/{id}/track", response_model=VesselTrackResponse)
def get_vessel_track(id: str, db: Session = Depends(get_db)):
    """Reconstructs and returns the complete historical telemetry track for a vessel."""
    vessel = db.query(Vessel).filter((Vessel.id == id) | (Vessel.mmsi == id)).first()
    if not vessel:
        raise HTTPException(status_code=404, detail=f"Vessel '{id}' not found.")

    positions = db.query(AISPosition).filter(AISPosition.vessel_id == vessel.id).order_by(AISPosition.timestamp).all()

    records = [
        AISRecord(
            mmsi=p.mmsi,
            imo=vessel.imo,
            vessel_name=vessel.name,
            vessel_type=vessel.vessel_type,
            flag=vessel.flag,
            timestamp=p.timestamp,
            latitude=p.latitude,
            longitude=p.longitude,
            speed_knots=p.speed_knots or 12.0,
            course_deg=p.course_deg or 0.0,
            heading_deg=p.heading_deg or 0.0,
            navigation_status=p.navigation_status or "UNDERWAY",
            source=p.source or "AIS",
            quality_score=p.quality_score or 1.0,
            gap_duration_hours=p.gap_duration_hours or 0.0
        )
        for p in positions
    ]

    analysis = AISTrajectoryReconstructor.reconstruct_and_analyze(records)

    return {
        "vessel": vessel,
        "track_length_km": analysis["track_length_km"],
        "total_positions": len(positions),
        "avg_speed_knots": analysis["avg_speed_knots"],
        "max_speed_knots": analysis["max_speed_knots"],
        "detected_gaps_count": len(analysis["detected_gaps"]),
        "max_gap_duration_hours": max([g.get("gap_duration_hours", 0.0) for g in analysis["detected_gaps"]], default=0.0),
        "geojson_linestring": analysis["geojson_linestring"] or {"type": "LineString", "coordinates": []},
        "positions": positions
    }
