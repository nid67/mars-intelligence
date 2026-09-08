"""
Lagrangian Drift Simulation API Router.
Provides standalone endpoints to trigger and query backward backtracking and forward spread simulations.
"""
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.drift import DriftRun
from backend.app.models.investigation import Investigation
from backend.app.models.spill import SpillDetection
from backend.app.schemas.drift import DriftRunCreate, DriftRunResponse
from backend.app.engines.drift import LagrangianDriftEngine
from backend.app.providers.factory import ProviderFactory

router = APIRouter(prefix="/drift", tags=["Drift Simulations"])


@router.post("/runs", response_model=DriftRunResponse, status_code=201)
def trigger_drift_simulation(payload: DriftRunCreate, db: Session = Depends(get_db)):
    """Trigger a customized Lagrangian drift simulation (BACKWARD or FORWARD)."""
    inv = db.query(Investigation).filter(Investigation.id == payload.investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{payload.investigation_id}' not found.")

    # Find spill centroid
    spill = None
    if payload.spill_detection_id:
        spill = db.query(SpillDetection).filter(SpillDetection.id == payload.spill_detection_id).first()
    if not spill:
        spill = db.query(SpillDetection).filter(SpillDetection.investigation_id == inv.id).first()

    centroid = spill.centroid if spill else [inv.bbox[0] + (inv.bbox[2]-inv.bbox[0])/2.0, inv.bbox[1] + (inv.bbox[3]-inv.bbox[1])/2.0]
    obs_time = inv.observation_time

    env_provider = ProviderFactory.get_environmental_provider(inv.data_mode)
    env_field = env_provider.get_environmental_field(inv.bbox, obs_time)

    engine = LagrangianDriftEngine(
        num_particles=payload.num_particles,
        windage_factor=payload.windage_factor,
        diffusion_coeff=payload.diffusion_coefficient
    )

    if payload.direction.upper() == "BACKWARD":
        res = engine.run_backward_drift(
            spill_centroid=centroid,
            observation_time=obs_time,
            env_field=env_field,
            backward_hours=payload.duration_hours,
            time_step_seconds=payload.time_step_seconds
        )
        sim_run = DriftRun(
            investigation_id=inv.id,
            spill_detection_id=spill.id if spill else None,
            direction="BACKWARD",
            status="COMPLETED",
            simulation_start_time=obs_time,
            simulation_end_time=obs_time - timedelta(hours=payload.duration_hours),
            duration_hours=payload.duration_hours,
            time_step_seconds=payload.time_step_seconds,
            num_particles=payload.num_particles,
            windage_factor=payload.windage_factor,
            diffusion_coefficient=payload.diffusion_coefficient,
            environmental_data_source=env_field.source,
            result_polygon=res["probable_origin_polygon"],
            release_window_start=res["release_window_start"],
            release_window_end=res["release_window_end"],
            uncertainty_radius_km=res["uncertainty_radius_km"],
            particle_trajectories=res["trajectories"]
        )
    else:
        res = engine.run_forward_forecast(
            spill_centroid=centroid,
            observation_time=obs_time,
            env_field=env_field,
            forecast_hours=payload.duration_hours,
            time_step_seconds=payload.time_step_seconds
        )
        sim_run = DriftRun(
            investigation_id=inv.id,
            spill_detection_id=spill.id if spill else None,
            direction="FORWARD",
            status="COMPLETED",
            simulation_start_time=obs_time,
            simulation_end_time=obs_time + timedelta(hours=payload.duration_hours),
            duration_hours=payload.duration_hours,
            time_step_seconds=payload.time_step_seconds,
            num_particles=payload.num_particles,
            windage_factor=payload.windage_factor,
            diffusion_coefficient=payload.diffusion_coefficient,
            environmental_data_source=env_field.source,
            result_polygon=res["snapshots"].get(f"+{int(payload.duration_hours)}h", {}).get("spread_polygon"),
            coastal_impact_proximity_km=res.get("coastal_impact_proximity_km")
        )

    db.add(sim_run)
    db.commit()
    db.refresh(sim_run)
    return sim_run


@router.get("/runs/{id}", response_model=DriftRunResponse)
def get_drift_run(id: str, db: Session = Depends(get_db)):
    """Retrieve details and trajectory particles of a specific drift run."""
    run = db.query(DriftRun).filter(DriftRun.id == id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"Drift run '{id}' not found.")
    return run


@router.get("/runs", response_model=List[DriftRunResponse])
def list_drift_runs(
    investigation_id: Optional[str] = None,
    direction: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List drift simulation runs."""
    query = db.query(DriftRun)
    if investigation_id:
        query = query.filter(DriftRun.investigation_id == investigation_id)
    if direction:
        query = query.filter(DriftRun.direction == direction.upper())
    return query.order_by(DriftRun.created_at.desc()).all()
