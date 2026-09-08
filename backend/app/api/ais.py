"""
AIS Telemetry Ingestion API Router.
Provides endpoints for ingesting and querying raw AIS position reports.
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.ais import AISPosition
from backend.app.models.vessel import Vessel
from backend.app.schemas.vessel import AISPositionCreate, AISPositionResponse

router = APIRouter(prefix="/ais", tags=["AIS"])


@router.post("/positions", response_model=AISPositionResponse, status_code=201)
def ingest_position(payload: AISPositionCreate, db: Session = Depends(get_db)):
    """Ingest a single AIS telemetry position broadcast."""
    vessel = db.query(Vessel).filter(Vessel.mmsi == payload.mmsi).first()
    if not vessel:
        # Automatically register vessel if not yet cataloged
        vessel = Vessel(
            mmsi=payload.mmsi,
            name=f"VESSEL-{payload.mmsi}",
            vessel_type="UNKNOWN",
            source=payload.source
        )
        db.add(vessel)
        db.flush()

    pos = AISPosition(
        vessel_id=vessel.id,
        mmsi=payload.mmsi,
        timestamp=payload.timestamp,
        latitude=payload.latitude,
        longitude=payload.longitude,
        speed_knots=payload.speed_knots,
        course_deg=payload.course_deg,
        heading_deg=payload.heading_deg,
        navigation_status=payload.navigation_status or "UNDERWAY",
        source=payload.source,
        quality_score=payload.quality_score,
        gap_duration_hours=payload.gap_duration_hours
    )
    db.add(pos)
    db.commit()
    db.refresh(pos)
    return pos


@router.get("/positions", response_model=List[AISPositionResponse])
def query_positions(
    mmsi: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Query ingested AIS positions with optional spatial/temporal filters."""
    query = db.query(AISPosition)
    if mmsi:
        query = query.filter(AISPosition.mmsi == mmsi)
    if start_time:
        query = query.filter(AISPosition.timestamp >= start_time)
    if end_time:
        query = query.filter(AISPosition.timestamp <= end_time)

    return query.order_by(AISPosition.timestamp.desc()).offset(skip).limit(limit).all()
