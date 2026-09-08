"""
Tests for CSIRO Sentinel-1 SAR Dataset Ingestion, Calibration, Training, and Inference.
"""
import os
import numpy as np
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.providers.demo.sentinel_dataset import (
    find_sentinel_dataset_path,
    get_dataset_stats,
    calibrate_uint8_to_db,
    load_sar_chip,
    list_chip_filenames,
    CSIRO_DOI
)
from backend.app.providers.demo.satellite import DemoSatelliteProvider
from backend.app.engines.detector import SpillDetector
from ml.inference.infer import MLInferenceService
from ml.evaluation.metrics import calculate_classification_metrics
from ml.training.train_classifier import train_classifier

client = TestClient(app)


def test_dataset_discovery_and_stats():
    """Verify that the local CSIRO Sentinel dataset is located and stats are accurately reported."""
    root = find_sentinel_dataset_path()
    assert root is not None, "Sentinel-1 dataset directory should be discoverable."
    assert os.path.exists(root)

    stats = get_dataset_stats()
    assert stats["available"] is True
    assert stats["total_chips"] > 0
    assert stats["class_0_chips"] > 0
    assert stats["class_1_chips"] > 0
    assert stats["doi"] == CSIRO_DOI


def test_uint8_to_db_calibration():
    """Verify radiometric dB calibration from 8-bit [0, 255] to SAR backscatter decibels."""
    raw = np.array([0, 128, 255], dtype=np.uint8)
    db = calibrate_uint8_to_db(raw, db_min=-28.0, db_max=-4.0)

    assert np.isclose(db[0], -28.0, atol=1e-2)
    assert np.isclose(db[2], -4.0, atol=1e-2)
    assert -28.0 < db[1] < -4.0
    assert db.dtype == np.float32


def test_load_sar_chip_oil_and_clean():
    """Verify loading real Class 1 (oil) and Class 0 (clean/look-alike) chips."""
    # Test Class 1 (Oil slick)
    data_c1, meta_c1 = load_sar_chip(class_label=1, index=0)
    assert data_c1.ndim == 2
    assert data_c1.shape == (400, 400)
    assert meta_c1["class_label"] == 1
    assert meta_c1["class_name"] == "Oil Spill Feature"
    assert meta_c1["calibrated_unit"] == "decibel (dB)"
    assert -30.0 <= meta_c1["mean_db"] <= 0.0

    # Test Class 0 (Clean sea / look-alike)
    data_c0, meta_c0 = load_sar_chip(class_label=0, index=0)
    assert data_c0.ndim == 2
    assert data_c0.shape == (400, 400)
    assert meta_c0["class_label"] == 0
    assert meta_c0["class_name"] == "Clean Sea / Look-alike"


def test_ml_inference_tile_classification():
    """Verify MLInferenceService computes P(oil) and classification metadata."""
    svc = MLInferenceService()
    chip_data, _ = load_sar_chip(class_label=1, index=0)

    result = svc.predict_tile_classification(chip_data)
    assert result["available"] is True
    assert 0.0 <= result["p_oil"] <= 1.0
    assert 0.0 <= result["p_clean"] <= 1.0
    assert result["predicted_class"] in [0, 1]
    assert result["label"] in ["POTENTIAL_OIL_SPILL", "CLEAN_SEA_OR_LOOK_ALIKE"]


def test_classification_metrics():
    """Verify forensic classification metric calculations."""
    y_true = np.array([1, 1, 0, 0, 1])
    y_pred = np.array([1, 0, 0, 0, 1])

    metrics = calculate_classification_metrics(y_true, y_pred)
    assert metrics["accuracy"] == 0.8
    assert metrics["true_positives"] == 2
    assert metrics["false_negatives"] == 1
    assert metrics["true_negatives"] == 2
    assert metrics["look_alike_rejection_rate"] == 1.0


def test_spill_detector_with_real_chip():
    """Verify SpillDetector processes a real CSIRO Sentinel chip with patch classification."""
    provider = DemoSatelliteProvider(seed=42)
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    scenes = provider.search_scenes([72.0, 18.0, 72.3, 18.3], now, now)
    assert len(scenes) > 0

    raster = provider.get_subset(scenes[0], [72.0, 18.0, 72.3, 18.3])
    assert raster.data.shape == (400, 400)
    assert raster.metadata.get("chip_name") is not None

    detector = SpillDetector()
    char, model_meta = detector.detect_and_characterize(raster)

    assert "patch_classification" in model_meta
    assert model_meta["patch_classification"]["available"] is True
    assert "detected_pixels" in model_meta["metrics_summary"]
    assert char["estimated_area_sqkm"] > 0
    assert len(char["centroid"]) == 2


def test_capabilities_api_reports_sentinel_dataset():
    """Verify GET /api/v1/system/capabilities includes sentinel_dataset statistics."""
    resp = client.get("/api/v1/system/capabilities")
    assert resp.status_code == 200
    data = resp.json()

    assert "sentinel_dataset" in data
    ds = data["sentinel_dataset"]
    assert ds["available"] is True
    assert ds["total_chips"] > 0
    assert ds["doi"] == CSIRO_DOI
