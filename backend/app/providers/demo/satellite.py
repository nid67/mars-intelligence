"""
Demonstration Satellite Provider.
Produces deterministic, physically-calibrated synthetic Sentinel-1 SAR imagery.
Strictly tagged with DATA MODE: DEMONSTRATION.
"""
from typing import List, Optional
from datetime import datetime, timezone
import numpy as np
from backend.app.providers.base.satellite import SatelliteProvider
from backend.app.providers.internal_models import NormalizedSatelliteScene, RasterSubset
from backend.app.core.logging import logger
from backend.app.providers.demo.sentinel_dataset import find_sentinel_dataset_path, load_sar_chip, CSIRO_DOI


class DemoSatelliteProvider(SatelliteProvider):
    def __init__(self, seed: int = 42):
        self.seed = seed
        self.rng = np.random.default_rng(seed)

    def search_scenes(
        self,
        bbox: List[float],
        start_time: datetime,
        end_time: datetime,
        polarization: Optional[str] = "VV+VH"
    ) -> List[NormalizedSatelliteScene]:
        min_lon, min_lat, max_lon, max_lat = bbox
        center_lat = (min_lat + max_lat) / 2.0
        center_lon = (min_lon + max_lon) / 2.0

        # Construct deterministic scene ID from coordinates
        lat_tag = f"{abs(int(center_lat * 10)):03d}N" if center_lat >= 0 else f"{abs(int(center_lat * 10)):03d}S"
        lon_tag = f"{abs(int(center_lon * 10)):03d}E" if center_lon >= 0 else f"{abs(int(center_lon * 10)):03d}W"
        date_str = start_time.strftime("%Y%m%d")

        ds_path = find_sentinel_dataset_path()
        sensor_tag = "Sentinel-1 C-SAR (CSIRO Real SAR Ingestion)" if ds_path else "Sentinel-1 C-SAR (Synthetic Model)"
        notice_tag = f"DATA MODE: DEMONSTRATION — CSIRO Sentinel-1 SAR chips (DOI: {CSIRO_DOI})" if ds_path else "DATA MODE: DEMONSTRATION — Synthetic SAR backscatter for SIH26143 demo"

        scene_id = f"S1A_IW_GRDH_1SDV_{date_str}T063000_{lat_tag}_{lon_tag}_DEMO"

        scene = NormalizedSatelliteScene(
            scene_id=scene_id,
            product_id=f"CDSE-{scene_id}",
            provider="DEMONSTRATION",
            acquisition_time=start_time,
            polarization="VV+VH",
            orbit_direction="DESCENDING",
            bbox=bbox,
            resolution_m=10.0,
            data_mode="DEMONSTRATION",
            source_url="local://sentinal-ds" if ds_path else "local://demo/sar_synthetic",
            metadata={
                "sensor": sensor_tag,
                "sub_swath": "IW",
                "calibration": "Sigma0_dB",
                "dataset_doi": CSIRO_DOI if ds_path else None,
                "notice": notice_tag
            }
        )
        return [scene]

    def get_scene(self, scene_id: str) -> NormalizedSatelliteScene:
        now = datetime.now(timezone.utc)
        return NormalizedSatelliteScene(
            scene_id=scene_id,
            product_id=f"CDSE-{scene_id}",
            provider="DEMONSTRATION",
            acquisition_time=now,
            polarization="VV+VH",
            orbit_direction="DESCENDING",
            bbox=[71.5, 18.5, 72.8, 19.8],
            resolution_m=10.0,
            data_mode="DEMONSTRATION",
            metadata={"notice": "DATA MODE: DEMONSTRATION"}
        )

    def get_subset(
        self,
        scene: NormalizedSatelliteScene,
        bbox: List[float],
        resolution_m: float = 10.0
    ) -> RasterSubset:
        """Loads a real Sentinel-1 SAR chip if CSIRO dataset exists, otherwise falls back

        to physically-calibrated synthetic SAR backscatter.
        """
        ds_path = find_sentinel_dataset_path()
        if ds_path:
            try:
                class_label = 1
                chip_name = None
                if scene.metadata:
                    class_label = int(scene.metadata.get("class_label", 1))
                    chip_name = scene.metadata.get("chip_name")

                raster_data, chip_meta = load_sar_chip(
                    class_label=class_label,
                    chip_name=chip_name,
                    index=self.seed
                )

                return RasterSubset(
                    scene_id=scene.scene_id,
                    bbox=bbox,
                    width=raster_data.shape[1],
                    height=raster_data.shape[0],
                    data=raster_data.astype(np.float32),
                    resolution_m=resolution_m,
                    crs="EPSG:4326",
                    metadata={
                        "mode": "DEMONSTRATION (REAL CSIRO SAR CHIPS)",
                        "sensor": "Sentinel-1 C-SAR (Ingested Real SAR Chip)",
                        "chip_name": chip_meta["chip_name"],
                        "class_label": chip_meta["class_label"],
                        "class_name": chip_meta["class_name"],
                        "dataset_doi": chip_meta["dataset_doi"],
                        "backscatter_unit": "decibel (dB)",
                        "min_db": float(np.min(raster_data)),
                        "max_db": float(np.max(raster_data)),
                        "mean_db": float(np.mean(raster_data))
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to load Sentinel SAR chip from dataset ({e}); falling back to synthetic generator.")

        # Synthetic Fallback: 256x256 calibrated SAR raster
        width = 256
        height = 256

        base_backscatter = -14.0
        speckle = self.rng.normal(0.0, 1.2, (height, width))
        raster_data = base_backscatter + speckle

        cy, cx = int(height * 0.48), int(width * 0.52)
        y_indices, x_indices = np.ogrid[:height, :width]

        theta = np.radians(35.0)
        cos_t, sin_t = np.cos(theta), np.sin(theta)

        xr = (x_indices - cx) * cos_t + (y_indices - cy) * sin_t
        yr = -(x_indices - cx) * sin_t + (y_indices - cy) * cos_t

        a = width * 0.18
        b = height * 0.05
        slick_dist = (xr / a) ** 2 + (yr / b) ** 2

        slick_mask = slick_dist <= 1.0
        raster_data[slick_mask] -= 8.5

        tail_dist = ((xr - 15) / (a * 1.3)) ** 2 + ((yr + 5) / (b * 1.1)) ** 2
        tail_mask = (tail_dist <= 1.0) & (~slick_mask)
        raster_data[tail_mask] -= 5.0

        return RasterSubset(
            scene_id=scene.scene_id,
            bbox=bbox,
            width=width,
            height=height,
            data=raster_data.astype(np.float32),
            resolution_m=resolution_m,
            crs="EPSG:4326",
            metadata={
                "mode": "DEMONSTRATION",
                "backscatter_unit": "decibel (dB)",
                "min_db": float(np.min(raster_data)),
                "max_db": float(np.max(raster_data)),
                "mean_db": float(np.mean(raster_data))
            }
        )

