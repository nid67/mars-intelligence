"""
SAR Dark Spot Detection & Inference Engine.
Seamlessly integrates PyTorch models with an Adaptive CFAR morphological fallback.
Ensures zero-crash execution while maintaining absolute scientific honesty.
"""
import os
import time
from typing import Dict, Any, Tuple
import numpy as np
from scipy import ndimage
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.providers.internal_models import RasterSubset
from backend.app.engines.characterization import SpillCharacterizationEngine
from ml.inference.infer import MLInferenceService


class SpillDetector:
    def __init__(self):
        self.model_path = settings.MODEL_PATH
        self.pytorch_model = None
        self.inference_svc = MLInferenceService(model_dir=self.model_path, device=settings.INFERENCE_DEVICE)
        self._try_load_model()

    def _try_load_model(self):
        """Attempts to load a trained PyTorch model if checkpoint exists."""
        unet_weight_path = os.path.join(self.model_path, "oil_spill_unet.pt")
        if os.path.exists(unet_weight_path):
            try:
                import torch
                from ml.models.unet import UNet
                device = torch.device(settings.INFERENCE_DEVICE)
                model = UNet(in_channels=1, num_classes=1)
                model.load_state_dict(torch.load(unet_weight_path, map_location=device))
                model.to(device)
                model.eval()
                self.pytorch_model = model
                logger.info(f"Loaded trained PyTorch U-Net checkpoint from {unet_weight_path}")
            except Exception as e:
                logger.warning(f"Failed to load PyTorch checkpoint ({e}); using CFAR fallback.")
                self.pytorch_model = None
        else:
            self.pytorch_model = None

    def detect_and_characterize(
        self,
        raster: RasterSubset,
        wind_speed_mps: float = 5.0,
        coastal_distance_km: float = 15.0
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """Runs dark spot detection and geometric spill characterization.

        Returns:
            (spill_characterization_dict, model_run_metadata)
        """
        start_time = time.perf_counter()
        data = raster.data  # 2D array in dB

        # Step A: Tile-level classification via PatchClassifier
        tile_eval = self.inference_svc.predict_tile_classification(data)

        # Step B: Pixel-level segmentation (PyTorch U-Net or Adaptive CFAR fallback)
        binary_mask = None
        model_mode = "DEMONSTRATION_FALLBACK"
        model_name = "Adaptive-CFAR-SAR-Detector"

        if self.pytorch_model is not None:
            # 1. PyTorch Deep Learning Mode
            norm_data = np.clip((data - (-28.0)) / ((-5.0) - (-28.0)), 0.0, 1.0).astype(np.float32)
            import torch
            with torch.no_grad():
                tensor = torch.from_numpy(norm_data).unsqueeze(0).unsqueeze(0).to(settings.INFERENCE_DEVICE)
                logits = self.pytorch_model(tensor)
                probs = torch.sigmoid(logits).squeeze().cpu().numpy()
                candidate_mask = (probs > settings.CONFIDENCE_THRESHOLD)

            # Safeguard: if untrained or degenerate (> 50% or 0 pixels), fall back to CFAR
            detected_ratio = np.sum(candidate_mask) / float(candidate_mask.size)
            if 0.0001 <= detected_ratio <= 0.50:
                binary_mask = candidate_mask
                model_mode = "ML"
                model_name = "UNet-S1-SAR"
            else:
                logger.info(f"U-Net produced atypical mask ratio ({detected_ratio:.2%}); applying Adaptive CFAR fallback.")

        if binary_mask is None:
            # 2. Demonstration Fallback Mode: Adaptive CFAR & Morphological Thresholding
            model_mode = "DEMONSTRATION_FALLBACK"
            model_name = "Adaptive-CFAR-SAR-Detector"


            # Compute local background statistics
            local_mean = ndimage.uniform_filter(data, size=21)
            local_sqr = ndimage.uniform_filter(data**2, size=21)
            local_std = np.sqrt(np.maximum(local_sqr - local_mean**2, 1e-4))

            # Dark spots: values significantly below local background (> 2.2 std devs lower)
            # and below an absolute threshold of -18.0 dB
            cfar_threshold = local_mean - (2.2 * local_std)
            raw_dark_spots = (data < cfar_threshold) & (data < -18.0)

            # Morphological noise cleaning: opening then closing
            struct = ndimage.generate_binary_structure(2, 1)
            clean_mask = ndimage.binary_opening(raw_dark_spots, structure=struct, iterations=1)
            binary_mask = ndimage.binary_closing(clean_mask, structure=struct, iterations=2)

        # Compute radiometric contrast margin (background mean dB minus slick mean dB)
        bg_pixels = data[~binary_mask]
        slick_pixels = data[binary_mask] if np.any(binary_mask) else data[data < -18.0]
        bg_mean = float(np.mean(bg_pixels)) if len(bg_pixels) > 0 else -14.0
        slick_mean = float(np.mean(slick_pixels)) if len(slick_pixels) > 0 else -22.0
        mean_contrast_db = max(1.0, bg_mean - slick_mean)

        # Characterize geometry
        characterization = SpillCharacterizationEngine.characterize_mask(
            binary_mask=binary_mask,
            bbox=raster.bbox,
            resolution_m=raster.resolution_m,
            wind_speed_mps=wind_speed_mps,
            coastal_distance_km=coastal_distance_km,
            mean_contrast_db=mean_contrast_db
        )

        if tile_eval.get("available") and tile_eval.get("p_oil") is not None:
            characterization["classifier_p_oil"] = tile_eval["p_oil"]
            characterization["classifier_label"] = tile_eval["label"]

        duration_ms = (time.perf_counter() - start_time) * 1000.0

        model_run_meta = {
            "model_name": model_name,
            "model_mode": model_mode,
            "model_version": "1.0.0",
            "task_type": "DETECTION_AND_SEGMENTATION",
            "inference_duration_ms": round(duration_ms, 2),
            "parameters": {
                "wind_speed_mps": wind_speed_mps,
                "coastal_distance_km": coastal_distance_km,
                "mean_contrast_db": round(mean_contrast_db, 2),
                "resolution_m": raster.resolution_m
            },
            "metrics_summary": {
                "detected_pixels": int(np.sum(binary_mask)),
                "total_pixels": int(binary_mask.size),
                "contrast_db": round(mean_contrast_db, 2)
            },
            "patch_classification": tile_eval
        }

        return characterization, model_run_meta
