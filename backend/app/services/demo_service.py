"""
Demonstration Scenarios & Database Seeding Service.
Loads case files from data/demo/ and idempotently initializes investigations,
spill detections, environmental forcings, and AIS telemetry tracks.
"""
import os
import json
import glob
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from backend.app.models.investigation import Investigation
from backend.app.models.satellite import SatelliteObservation
from backend.app.models.spill import SpillDetection
from backend.app.models.vessel import Vessel
from backend.app.models.ais import AISPosition
from backend.app.models.environment import EnvironmentalObservation
from backend.app.models.datasource import DataSource
from backend.app.providers.demo.ais import DemoAISProvider
from backend.app.core.logging import logger

DEMO_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data", "demo")


class DemoService:
    @staticmethod
    def list_demo_cases() -> List[Dict[str, Any]]:
        """Scans data/demo/ for available case scenarios."""
        cases = []
        case_files = glob.glob(os.path.join(DEMO_DIR, "*", "case.json"))
        for cf in sorted(case_files):
            try:
                with open(cf, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    cases.append({
                        "case_id": data.get("case_id"),
                        "name": data.get("name"),
                        "region": data.get("region"),
                        "data_mode": data.get("data_mode", "DEMONSTRATION"),
                        "observation_time": data.get("observation_time"),
                        "bbox": data.get("bbox"),
                        "description": data.get("description"),
                        "center": data.get("center"),
                        "total_vessels": len(data.get("vessels", [])),
                        "primary_candidate": next(
                            (v.get("name") for v in data.get("vessels", []) if v.get("role") == "PRIMARY_CANDIDATE"), None
                        )
                    })
            except Exception as e:
                logger.warning(f"Failed to read demo case file {cf}: {e}")
        return cases

    @staticmethod
    def seed_demo_cases(db: Session) -> Dict[str, Any]:
        """Seeds all demo cases into the database idempotently."""
        case_files = glob.glob(os.path.join(DEMO_DIR, "*", "case.json"))
        seeded_summaries = []
        inv_ids = {}

        ais_provider = DemoAISProvider()

        for cf in sorted(case_files):
            with open(cf, "r", encoding="utf-8") as f:
                case_data = json.load(f)

            case_name = case_data["name"]
            existing_inv = db.query(Investigation).filter(Investigation.name == case_name).first()

            if existing_inv:
                logger.info(f"Demo case '{case_name}' already exists in database (ID: {existing_inv.id}). Skipping re-creation.")
                inv_ids[case_data["case_id"]] = str(existing_inv.id)
                continue

            obs_time = datetime.fromisoformat(case_data["observation_time"].replace("Z", "+00:00"))
            bbox = case_data["bbox"]

            # 1. Create Investigation
            inv = Investigation(
                name=case_name,
                region=case_data["region"],
                data_mode=case_data.get("data_mode", "DEMONSTRATION"),
                status="CREATED",
                observation_time=obs_time,
                bbox=bbox,
                description=case_data.get("description"),
                pipeline_params={"case_id": case_data["case_id"]}
            )
            db.add(inv)
            db.flush()
            inv_ids[case_data["case_id"]] = str(inv.id)

            # 2. Create Satellite Observation
            sat_obs = SatelliteObservation(
                investigation_id=inv.id,
                provider="DEMONSTRATION",
                data_mode=case_data.get("data_mode", "DEMONSTRATION"),
                scene_id=f"S1A_IW_GRDH_1SDV_{obs_time.strftime('%Y%m%d')}_{case_data['case_id'].upper()}",
                acquisition_time=obs_time,
                bbox=bbox,
                source_url=f"local://demo/{case_data['case_id']}",
                raw_metadata={"case_id": case_data["case_id"]}
            )
            db.add(sat_obs)
            db.flush()

            # 3. Create Environmental Observation
            env_cfg = case_data.get("environmental", {})
            env_obs = EnvironmentalObservation(
                investigation_id=inv.id,
                timestamp=obs_time,
                latitude=case_data["center"][1],
                longitude=case_data["center"][0],
                u_current=env_cfg.get("u_current", 0.15),
                v_current=env_cfg.get("v_current", -0.15),
                u_wind=env_cfg.get("u_wind", 3.5),
                v_wind=env_cfg.get("v_wind", -4.0),
                source=env_cfg.get("source", "DEMONSTRATION"),
                resolution=env_cfg.get("resolution", "0.083 deg")
            )
            db.add(env_obs)

            # 4. Create Vessels & Ingest AIS Tracks
            start_window = obs_time - (datetime.fromtimestamp(3600 * 18, tz=timezone.utc) - datetime.fromtimestamp(0, tz=timezone.utc))
            end_window = obs_time + (datetime.fromtimestamp(3600 * 6, tz=timezone.utc) - datetime.fromtimestamp(0, tz=timezone.utc))

            for v_info in case_data.get("vessels", []):
                mmsi = v_info["mmsi"]
                vessel = db.query(Vessel).filter(Vessel.mmsi == mmsi).first()
                if not vessel:
                    vessel = Vessel(
                        mmsi=mmsi,
                        imo=v_info.get("imo"),
                        name=v_info.get("name", "UNKNOWN"),
                        vessel_type=v_info.get("vessel_type", "TANKER"),
                        flag=v_info.get("flag", "IN"),
                        source="DEMONSTRATION"
                    )
                    db.add(vessel)
                    db.flush()

                # Generate track positions
                track = ais_provider.get_tracks(mmsi, start_window, end_window)
                for pos in track.positions:
                    ais_pos = AISPosition(
                        vessel_id=vessel.id,
                        mmsi=mmsi,
                        timestamp=pos.timestamp,
                        latitude=pos.latitude,
                        longitude=pos.longitude,
                        speed_knots=pos.speed_knots,
                        course_deg=pos.course_deg,
                        heading_deg=pos.heading_deg,
                        navigation_status=pos.navigation_status,
                        source=pos.source,
                        quality_score=pos.quality_score,
                        gap_duration_hours=pos.gap_duration_hours
                    )
                    db.add(ais_pos)

            # 5. Record Data Source Provenance
            db.add(DataSource(
                investigation_id=inv.id,
                provider="DEMONSTRATION",
                dataset_name="MARS_SYNTHETIC_SCENARIOS",
                dataset_version="1.0.0",
                query_time=datetime.now(timezone.utc),
                observation_time=obs_time,
                source_identifier=case_data["case_id"],
                data_mode=case_data.get("data_mode", "DEMONSTRATION"),
                license_metadata="SIH-2026 Academic Evaluation License"
            ))

        db.commit()
        cases = DemoService.list_demo_cases()
        return {
            "status": "SUCCESS",
            "message": f"Successfully seeded {len(cases)} generic demonstration scenarios.",
            "seeded_cases_count": len(cases),
            "cases": cases,
            "investigation_ids": inv_ids
        }

    @staticmethod
    def reset_demo_cases(db: Session) -> Dict[str, Any]:
        """Cleans all seeded demo cases and related records."""
        deleted_counts = {}
        for model_cls, name in [
            (SpillDetection, "spill_detections"),
            (SatelliteObservation, "satellite_observations"),
            (EnvironmentalObservation, "environmental_observations"),
            (AISPosition, "ais_positions"),
            (Investigation, "investigations"),
            (DataSource, "data_sources")
        ]:
            count = db.query(model_cls).delete()
            deleted_counts[name] = count
        db.commit()
        return {
            "status": "SUCCESS",
            "message": "Demo data successfully reset.",
            "cleared_records": deleted_counts
        }
