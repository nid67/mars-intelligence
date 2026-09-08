"""
Demonstration AIS Provider.
Generates deterministic, forensically-sound vessel traffic and telemetry tracks.
Adheres strictly to forensic neutrality: records gaps and speed changes without presumption of guilt.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import math
from backend.app.providers.base.ais import AISProvider
from backend.app.providers.internal_models import AISRecord, VesselTrack


class DemoAISProvider(AISProvider):
    def __init__(self, seed: int = 42):
        self.seed = seed

    def search_vessels(
        self,
        bbox: List[float],
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict[str, Any]]:
        """Return candidate vessels present in the investigation scenario."""
        min_lon, min_lat, max_lon, max_lat = bbox
        center_lon = (min_lon + max_lon) / 2.0
        center_lat = (min_lat + max_lat) / 2.0

        return [
            {
                "mmsi": "419000101",
                "imo": "9382011",
                "name": "OCEAN VOYAGER",
                "vessel_type": "CRUDE_OIL_TANKER",
                "flag": "IN",
                "length_m": 274.0,
                "width_m": 48.0,
                "gross_tonnage": 84500.0,
                "source": "DEMONSTRATION"
            },
            {
                "mmsi": "419000102",
                "imo": "9451022",
                "name": "ARABIAN STAR",
                "vessel_type": "PRODUCT_TANKER",
                "flag": "LR",
                "length_m": 183.0,
                "width_m": 32.0,
                "gross_tonnage": 29800.0,
                "source": "DEMONSTRATION"
            },
            {
                "mmsi": "419000103",
                "imo": "9612033",
                "name": "MUMBAI PEARL",
                "vessel_type": "BULK_CARRIER",
                "flag": "PA",
                "length_m": 225.0,
                "width_m": 32.2,
                "gross_tonnage": 43000.0,
                "source": "DEMONSTRATION"
            },
            {
                "mmsi": "419000104",
                "imo": "9723044",
                "name": "BLUE TIDE",
                "vessel_type": "CONTAINER_SHIP",
                "flag": "SG",
                "length_m": 299.0,
                "width_m": 40.0,
                "gross_tonnage": 66000.0,
                "source": "DEMONSTRATION"
            }
        ]

    def get_tracks(
        self,
        mmsi: str,
        start_time: datetime,
        end_time: datetime
    ) -> VesselTrack:
        """Construct realistic telemetry positions between start_time and end_time."""
        # Calculate time steps (every 15 minutes)
        total_seconds = (end_time - start_time).total_seconds()
        step_seconds = 900  # 15 min
        num_steps = max(5, int(total_seconds / step_seconds))

        records: List[AISRecord] = []

        # Determine vessel profile by MMSI
        if mmsi.endswith("101") or mmsi.endswith("201") or mmsi.endswith("301") or mmsi.endswith("401"):
            # PRIMARY CANDIDATE: Transits through center of AOI during middle of window
            v_name = "OCEAN VOYAGER"
            v_type = "CRUDE_OIL_TANKER"
            imo = "9382011"
            base_speed = 13.5
            has_gap = False
            lat_start, lat_end = 18.8, 19.5
            lon_start, lon_end = 71.9, 72.4
        elif mmsi.endswith("102") or mmsi.endswith("202") or mmsi.endswith("302") or mmsi.endswith("402"):
            # SECONDARY CANDIDATE: Transits nearby with an AIS coverage gap
            v_name = "ARABIAN STAR"
            v_type = "PRODUCT_TANKER"
            imo = "9451022"
            base_speed = 11.8
            has_gap = True
            lat_start, lat_end = 18.7, 19.3
            lon_start, lon_end = 72.3, 72.6
        elif mmsi.endswith("103") or mmsi.endswith("203") or mmsi.endswith("303") or mmsi.endswith("403"):
            # NON-COMPATIBLE DISTANCE: Parallel corridor far offshore
            v_name = "MUMBAI PEARL"
            v_type = "BULK_CARRIER"
            imo = "9612033"
            base_speed = 12.2
            has_gap = False
            lat_start, lat_end = 18.6, 19.6
            lon_start, lon_end = 71.6, 71.7
        else:
            # OTHER / CONTAINER: Fast transit
            v_name = "BLUE TIDE"
            v_type = "CONTAINER_SHIP"
            imo = "9723044"
            base_speed = 19.0
            has_gap = False
            lat_start, lat_end = 18.9, 19.7
            lon_start, lon_end = 72.5, 72.7

        prev_time = start_time
        total_dist_km = 0.0
        speeds = []
        max_gap_hours = 0.0
        gap_count = 0

        for i in range(num_steps):
            frac = i / float(num_steps - 1)
            cur_time = start_time + timedelta(seconds=i * step_seconds)

            # If this vessel has an intentional demo gap in the middle
            if has_gap and 0.35 <= frac <= 0.60:
                # Omit points to simulate satellite line-of-sight / terrestrial reception gap
                continue

            lat = lat_start + frac * (lat_end - lat_start)
            lon = lon_start + frac * (lon_end - lon_start)

            # Small realistic drift jitter
            lat += math.sin(i * 0.4) * 0.003
            lon += math.cos(i * 0.4) * 0.003

            # Calculate gap since previous ingested record
            delta_h = (cur_time - prev_time).total_seconds() / 3600.0
            if len(records) > 0 and delta_h > 2.0:
                gap_duration = delta_h
                gap_count += 1
                max_gap_hours = max(max_gap_hours, gap_duration)
            else:
                gap_duration = 0.0

            speed = base_speed + math.sin(i * 0.5) * 0.4
            speeds.append(speed)

            # Course calculation
            bearing = math.degrees(math.atan2(lon_end - lon_start, lat_end - lat_start)) % 360.0

            rec = AISRecord(
                mmsi=mmsi,
                imo=imo,
                vessel_name=v_name,
                vessel_type=v_type,
                flag="IN",
                timestamp=cur_time,
                latitude=round(lat, 5),
                longitude=round(lon, 5),
                speed_knots=round(speed, 1),
                course_deg=round(bearing, 1),
                heading_deg=round(bearing, 1),
                navigation_status="UNDERWAY_USING_ENGINE",
                source="DEMONSTRATION",
                quality_score=0.85 if gap_duration > 0 else 1.0,
                gap_duration_hours=round(gap_duration, 2)
            )
            records.append(rec)

            if len(records) > 1:
                # Approx distance step in km (1 deg lat ~ 111 km)
                dlat = (records[-1].latitude - records[-2].latitude) * 111.0
                dlon = (records[-1].longitude - records[-2].longitude) * 111.0 * math.cos(math.radians(lat))
                total_dist_km += math.sqrt(dlat**2 + dlon**2)

            prev_time = cur_time

        avg_speed = sum(speeds) / len(speeds) if speeds else base_speed
        max_speed = max(speeds) if speeds else base_speed

        return VesselTrack(
            vessel_mmsi=mmsi,
            vessel_name=v_name,
            vessel_type=v_type,
            positions=records,
            track_length_km=round(total_dist_km, 2),
            avg_speed_knots=round(avg_speed, 1),
            max_speed_knots=round(max_speed, 1),
            detected_gaps=gap_count,
            max_gap_hours=round(max_gap_hours, 2),
            metadata={"data_mode": "DEMONSTRATION"}
        )

    def get_vessel_identity(self, identifier: str) -> Optional[Dict[str, Any]]:
        return {
            "mmsi": identifier,
            "name": f"VESSEL-{identifier}",
            "vessel_type": "OIL_TANKER",
            "flag": "IN",
            "source": "DEMONSTRATION_REGISTRY"
        }
