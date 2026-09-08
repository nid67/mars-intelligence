"""
Unit Tests for Lagrangian Particle Drift Engine.
Verifies backward backtracking, forward spread forecast, advection conservation,
and stochastic dispersion boundaries.
"""
from datetime import datetime, timezone
import pytest
from backend.app.engines.drift import LagrangianDriftEngine
from backend.app.providers.internal_models import EnvironmentalField


def test_drift_backward_origin_reconstruction():
    """Verify that backward drift models negative advection and generates valid origin polygon."""
    engine = LagrangianDriftEngine(num_particles=200, windage_factor=0.032, diffusion_coeff=2.0, seed=42)

    centroid = [72.18, 19.12]
    obs_time = datetime(2026, 3, 14, 6, 30, tzinfo=timezone.utc)

    # Southward current (v_current < 0) and southward wind (v_wind < 0)
    # Drift is southward -> Backtracking should move northward (latitude increases)
    env_field = EnvironmentalField(
        timestamp=obs_time,
        min_lon=71.5,
        min_lat=18.5,
        max_lon=72.8,
        max_lat=19.8,
        u_current=0.10,
        v_current=-0.20,
        u_wind=3.0,
        v_wind=-5.0,
        source="DEMONSTRATION",
        resolution="0.083 deg"
    )

    result = engine.run_backward_drift(
        spill_centroid=centroid,
        observation_time=obs_time,
        env_field=env_field,
        backward_hours=12.0
    )

    assert result["direction"] == "BACKWARD"
    assert result["num_particles"] == 200
    assert result["probable_origin_polygon"] is not None
    assert result["probable_origin_polygon"]["type"] == "Polygon"

    # Origin centroid should be North and West of the spill (due to South-East net drift)
    origin_lon, origin_lat = result["origin_centroid"]
    assert origin_lat > centroid[1]  # Moved North backwards
    assert origin_lon < centroid[0]  # Moved West backwards

    # Release window verification
    assert result["release_window_start"] < obs_time
    assert result["release_window_end"] <= obs_time
    assert result["release_window_start"] < result["release_window_end"]

    # Dispersion uncertainty radius
    assert 1.0 < result["uncertainty_radius_km"] < 25.0


def test_drift_forward_spread_forecast():
    """Verify forward trajectory spreading and coastal proximity calculation."""
    engine = LagrangianDriftEngine(num_particles=150, windage_factor=0.032, diffusion_coeff=2.0, seed=42)

    centroid = [72.18, 19.12]
    obs_time = datetime(2026, 3, 14, 6, 30, tzinfo=timezone.utc)

    env_field = EnvironmentalField(
        timestamp=obs_time,
        min_lon=71.5,
        min_lat=18.5,
        max_lon=72.8,
        max_lat=19.8,
        u_current=0.15,
        v_current=0.10,
        u_wind=4.0,
        v_wind=3.0,
        source="DEMONSTRATION",
        resolution="0.083 deg"
    )

    result = engine.run_forward_forecast(
        spill_centroid=centroid,
        observation_time=obs_time,
        env_field=env_field,
        forecast_hours=24.0,
        coastal_distance_km=30.0
    )

    assert result["direction"] == "FORWARD"
    assert "+6h" in result["snapshots"]
    assert "+12h" in result["snapshots"]
    assert "+24h" in result["snapshots"]

    poly_24h = result["snapshots"]["+24h"]["spread_polygon"]
    assert poly_24h["type"] == "Polygon"
    assert result["coastal_impact_proximity_km"] is not None
