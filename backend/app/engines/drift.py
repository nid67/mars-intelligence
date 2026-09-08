"""
Physical Lagrangian Particle Drift Engine.
Simulates surface transport governed by ocean current advection, atmospheric windage drag,
and stochastic horizontal eddy diffusion.
Supports backward origin backtracking and forward forecast spreading.
"""
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta, timezone
import math
import numpy as np
from shapely.geometry import MultiPoint, Polygon, Point, mapping
from backend.app.providers.internal_models import EnvironmentalField


class LagrangianDriftEngine:
    def __init__(
        self,
        num_particles: int = 500,
        windage_factor: float = 0.032,
        diffusion_coeff: float = 2.5,
        seed: int = 42
    ):
        self.num_particles = num_particles
        self.windage_factor = windage_factor
        self.diffusion_coeff = diffusion_coeff
        self.rng = np.random.default_rng(seed)

    def run_backward_drift(
        self,
        spill_centroid: List[float],  # [lon, lat]
        observation_time: datetime,
        env_field: EnvironmentalField,
        backward_hours: float = 12.0,
        time_step_seconds: int = 600
    ) -> Dict[str, Any]:
        """Back-tracks particles backwards in time to reconstruct the probable origin region

        and estimated release window.
        """
        center_lon, center_lat = spill_centroid
        # Initial particle ensemble distributed around spill centroid
        init_radius_deg = 0.005  # ~500m initial spread
        angles = self.rng.uniform(0, 2 * np.pi, self.num_particles)
        radii = self.rng.uniform(0, init_radius_deg, self.num_particles)

        lons = center_lon + radii * np.cos(angles)
        lats = center_lat + radii * np.sin(angles)

        # Net physical drift velocity vector (m/s)
        # v_net = v_current + alpha * v_wind
        u_net = env_field.u_current + (self.windage_factor * env_field.u_wind)
        v_net = env_field.v_current + (self.windage_factor * env_field.v_wind)

        # In backward tracking, particles move in the opposite direction of drift
        # u_back = -u_net, v_back = -v_net
        num_steps = int((backward_hours * 3600) / time_step_seconds)
        dt = time_step_seconds

        trajectories = []
        # Sample snapshots at 2h, 4h, 6h, 8h, 12h, etc.
        sample_step_interval = max(1, num_steps // 6)

        # Conversions: 1 deg lat ~ 111,139 m; 1 deg lon ~ 111,139 * cos(lat) m
        mean_lat_rad = math.radians(center_lat)
        m_per_deg_lat = 111139.0
        m_per_deg_lon = 111139.0 * math.cos(mean_lat_rad)

        for step in range(num_steps):
            # Stochastic Brownian diffusion: delta = sqrt(2 * Kh * dt) * N(0, 1)
            diff_step_m = math.sqrt(2.0 * self.diffusion_coeff * dt)
            u_diff = self.rng.normal(0.0, diff_step_m, self.num_particles) / dt
            v_diff = self.rng.normal(0.0, diff_step_m, self.num_particles) / dt

            # Advection step backwards
            dlons_m = (-u_net + u_diff) * dt
            dlats_m = (-v_net + v_diff) * dt

            lons += dlons_m / m_per_deg_lon
            lats += dlats_m / m_per_deg_lat

            if step % sample_step_interval == 0 or step == num_steps - 1:
                elapsed_hours = round(((step + 1) * dt) / 3600.0, 1)
                trajectories.append({
                    "step": step,
                    "elapsed_hours_backward": elapsed_hours,
                    "mean_lon": round(float(np.mean(lons)), 5),
                    "mean_lat": round(float(np.mean(lats)), 5),
                    "dispersion_radius_km": round(float(np.std(lats) * 111.0 * 2.0), 2),
                    "sample_points": [
                        [round(float(lons[k]), 5), round(float(lats[k]), 5)]
                        for k in range(min(20, self.num_particles))
                    ]
                })

        # Calculate Probable Origin Region Polygon using Shapely Convex/Concave Hull
        coords = np.column_stack([lons, lats])
        mp = MultiPoint(coords)
        hull = mp.convex_hull
        if hull.geom_type == "Polygon":
            origin_polygon = mapping(hull)
        else:
            origin_polygon = mapping(hull.buffer(0.015))

        # Estimated Release Window:
        # Based on backward duration with a 4-hour plausible uncertainty bracket
        origin_center_time = observation_time - timedelta(hours=backward_hours * 0.65)
        release_window_start = origin_center_time - timedelta(hours=backward_hours * 0.35)
        release_window_end = observation_time - timedelta(hours=backward_hours * 0.20)

        # Origin uncertainty dispersion radius
        dispersion_km = round(float(np.std(lats) * 111.0 * 2.5), 2)

        return {
            "direction": "BACKWARD",
            "duration_hours": backward_hours,
            "num_particles": self.num_particles,
            "windage_factor": self.windage_factor,
            "diffusion_coeff": self.diffusion_coeff,
            "probable_origin_polygon": origin_polygon,
            "origin_centroid": [round(float(np.mean(lons)), 5), round(float(np.mean(lats)), 5)],
            "release_window_start": release_window_start,
            "release_window_end": release_window_end,
            "uncertainty_radius_km": dispersion_km,
            "trajectories": trajectories,
            "drift_velocity_mps": {
                "u_net": round(u_net, 3),
                "v_net": round(v_net, 3),
                "speed": round(math.sqrt(u_net**2 + v_net**2), 3),
                "bearing_deg": round((math.degrees(math.atan2(u_net, v_net)) + 360.0) % 360.0, 1)
            }
        }

    def run_forward_forecast(
        self,
        spill_centroid: List[float],
        observation_time: datetime,
        env_field: EnvironmentalField,
        forecast_hours: float = 24.0,
        time_step_seconds: int = 600,
        coastal_distance_km: float = 25.0
    ) -> Dict[str, Any]:
        """Forecasts future slick propagation (+6h, +12h, +24h) and calculates shoreline impact proximity."""
        center_lon, center_lat = spill_centroid
        angles = self.rng.uniform(0, 2 * np.pi, self.num_particles)
        radii = self.rng.uniform(0, 0.005, self.num_particles)

        lons = center_lon + radii * np.cos(angles)
        lats = center_lat + radii * np.sin(angles)

        u_net = env_field.u_current + (self.windage_factor * env_field.u_wind)
        v_net = env_field.v_current + (self.windage_factor * env_field.v_wind)

        num_steps = int((forecast_hours * 3600) / time_step_seconds)
        dt = time_step_seconds

        mean_lat_rad = math.radians(center_lat)
        m_per_deg_lat = 111139.0
        m_per_deg_lon = 111139.0 * math.cos(mean_lat_rad)

        snapshots = {}
        target_hours = [6, 12, 24]

        for step in range(1, num_steps + 1):
            diff_step_m = math.sqrt(2.0 * self.diffusion_coeff * dt)
            u_diff = self.rng.normal(0.0, diff_step_m, self.num_particles) / dt
            v_diff = self.rng.normal(0.0, diff_step_m, self.num_particles) / dt

            dlons_m = (u_net + u_diff) * dt
            dlats_m = (v_net + v_diff) * dt

            lons += dlons_m / m_per_deg_lon
            lats += dlats_m / m_per_deg_lat

            cur_hour = (step * dt) / 3600.0
            for th in target_hours:
                if abs(cur_hour - th) < (dt / 7200.0) and f"+{th}h" not in snapshots:
                    coords = np.column_stack([lons, lats])
                    mp = MultiPoint(coords)
                    hull = mp.convex_hull
                    poly_json = mapping(hull) if hull.geom_type == "Polygon" else mapping(hull.buffer(0.015))
                    snapshots[f"+{th}h"] = {
                        "forecast_hour": th,
                        "valid_time": observation_time + timedelta(hours=th),
                        "centroid": [round(float(np.mean(lons)), 5), round(float(np.mean(lats)), 5)],
                        "spread_polygon": poly_json,
                        "dispersion_radius_km": round(float(np.std(lats) * 111.0 * 2.0), 2)
                    }

        # Projected coastal proximity after 24h
        total_drift_km = math.sqrt(u_net**2 + v_net**2) * 3.6 * forecast_hours
        est_proximity = max(0.0, round(coastal_distance_km - (total_drift_km * 0.4), 1))

        return {
            "direction": "FORWARD",
            "forecast_duration_hours": forecast_hours,
            "snapshots": snapshots,
            "coastal_impact_proximity_km": est_proximity,
            "status": "COMPLETED"
        }
