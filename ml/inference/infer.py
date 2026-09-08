"""
Inference Service for MARS ML Models.
Loads PyTorch checkpoints and executes tile classification and pixel-level segmentation.
"""
import os
from typing import Optional, Dict, Any
import numpy as np
import torch

from ml.models.unet import UNet
from ml.models.classifier import PatchClassifier


class MLInferenceService:
    def __init__(self, model_dir: str = "models", device: str = "cpu"):
        self.model_dir = model_dir
        self.device = torch.device(device)
        self.unet_model: Optional[UNet] = None
        self.classifier_model: Optional[PatchClassifier] = None
        self.load_models()

    def load_models(self):
        unet_path = os.path.join(self.model_dir, "oil_spill_unet.pt")
        if os.path.exists(unet_path):
            try:
                m = UNet(in_channels=1, num_classes=1)
                m.load_state_dict(torch.load(unet_path, map_location=self.device))
                m.to(self.device)
                m.eval()
                self.unet_model = m
            except Exception:
                self.unet_model = None

        classifier_path = os.path.join(self.model_dir, "oil_spill_classifier.pt")
        if os.path.exists(classifier_path):
            try:
                clf = PatchClassifier(in_channels=1, num_classes=2)
                clf.load_state_dict(torch.load(classifier_path, map_location=self.device))
                clf.to(self.device)
                clf.eval()
                self.classifier_model = clf
            except Exception:
                self.classifier_model = None

    def predict_segmentation(self, normalized_patch: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        """Run U-Net segmentation on normalized [0, 1] SAR patch (H, W)."""
        if self.unet_model is None:
            raise RuntimeError("U-Net model checkpoint not loaded.")

        with torch.no_grad():
            tensor = torch.from_numpy(normalized_patch.astype(np.float32)).unsqueeze(0).unsqueeze(0).to(self.device)
            logits = self.unet_model(tensor)
            probs = torch.sigmoid(logits).squeeze().cpu().numpy()
            return (probs >= threshold).astype(bool)

    def predict_tile_classification(self, patch: np.ndarray) -> Dict[str, Any]:
        """Runs tile-level patch classification returning oil probability, label, and confidence."""
        if self.classifier_model is None:
            return {
                "available": False,
                "p_oil": None,
                "p_clean": None,
                "predicted_class": None,
                "label": "CLASSIFIER_UNAVAILABLE",
                "confidence": None
            }

        arr = patch.astype(np.float32)
        # Normalize if in dB [-28, -4] or [0, 255]
        if float(np.min(arr)) < 0.0:
            arr = np.clip((arr - (-28.0)) / ((-4.0) - (-28.0)), 0.0, 1.0)
        elif float(np.max(arr)) > 1.0:
            arr = arr / 255.0

        with torch.no_grad():
            tensor = torch.from_numpy(arr).unsqueeze(0).unsqueeze(0).to(self.device)
            logits = self.classifier_model(tensor)
            probs = torch.softmax(logits, dim=1).squeeze().cpu().numpy()
            p_clean = float(probs[0])
            p_oil = float(probs[1])
            pred_class = 1 if p_oil >= 0.5 else 0

        return {
            "available": True,
            "p_oil": round(p_oil, 4),
            "p_clean": round(p_clean, 4),
            "predicted_class": pred_class,
            "label": "POTENTIAL_OIL_SPILL" if pred_class == 1 else "CLEAN_SEA_OR_LOOK_ALIKE",
            "confidence": round(max(p_oil, p_clean), 4)
        }

