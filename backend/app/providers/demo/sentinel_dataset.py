"""
CSIRO Sentinel-1 SAR Dataset Ingestion & Calibration Module.
Loads authentic 400x400 Sentinel-1 SAR image chips (DOI: 10.25919/4v55-dn16).
Converts raw 8-bit SAR intensities to calibrated radar backscatter in decibels (dB).
"""
import os
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
import numpy as np
from PIL import Image

from backend.app.core.logging import logger

CSIRO_DOI = "10.25919/4v55-dn16"
CSIRO_TITLE = "CSIRO Sentinel-1 SAR image dataset of oil- and non-oil features for machine learning"
CSIRO_CITATION = "Blondeau-Patissier, D., Schroeder, T., Diakogiannis, F., & Li, Z. (2022). CSIRO Data Access Portal."

CANDIDATE_PATHS = [
    "sentinal-ds",
    "sentinel-ds",
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "sentinal-ds"),
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "sentinel-ds"),
    "e:/mars-int/sentinal-ds",
    "e:/mars-int/sentinel-ds",
]


def find_sentinel_dataset_path() -> Optional[str]:
    """Finds the root path of the Sentinel dataset on the local filesystem."""
    for candidate in CANDIDATE_PATHS:
        p = Path(candidate)
        if p.exists() and (p / "kaggle" / "data").exists():
            return str(p.resolve())
    return None


def get_dataset_stats() -> Dict[str, Any]:
    """Returns dataset availability and summary statistics."""
    root = find_sentinel_dataset_path()
    if not root:
        return {
            "available": False,
            "path": None,
            "total_chips": 0,
            "class_0_chips": 0,
            "class_1_chips": 0,
            "doi": CSIRO_DOI,
            "citation": CSIRO_CITATION
        }

    data_dir = Path(root) / "kaggle" / "data"
    c0_dir = data_dir / "Class_0"
    c1_dir = data_dir / "Class_1"

    c0_count = len(list(c0_dir.glob("*.jpg"))) if c0_dir.exists() else 0
    c1_count = len(list(c1_dir.glob("*.jpg"))) if c1_dir.exists() else 0

    return {
        "available": True,
        "path": str(root),
        "total_chips": c0_count + c1_count,
        "class_0_chips": c0_count,
        "class_1_chips": c1_count,
        "doi": CSIRO_DOI,
        "citation": CSIRO_CITATION,
        "polarization": "VV (single band grayscale)",
        "resolution": "400x400 pixels (~10-20m spatial resolution)"
    }


def list_chip_filenames(class_label: int = 1) -> List[str]:
    """Lists available chip filenames for a given class (0 or 1)."""
    root = find_sentinel_dataset_path()
    if not root:
        return []
    class_folder = f"Class_{class_label}"
    target_dir = Path(root) / "kaggle" / "data" / class_folder
    if not target_dir.exists():
        return []
    return sorted([f.name for f in target_dir.glob("*.jpg")])


def calibrate_uint8_to_db(arr: np.ndarray, db_min: float = -28.0, db_max: float = -4.0) -> np.ndarray:
    """
    Calibrates 8-bit SAR grayscale values [0, 255] to physically realistic
    radar backscatter in decibels (dB), where low values indicate high damping/dark spots.
    """
    normalized = arr.astype(np.float32) / 255.0
    return db_min + normalized * (db_max - db_min)


def load_sar_chip(
    class_label: int = 1,
    chip_name: Optional[str] = None,
    index: int = 0,
    target_size: Optional[Tuple[int, int]] = None
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Loads a real Sentinel-1 SAR image chip, converts it to 2D grayscale float32 array in dB.

    Returns:
        (raster_db, metadata_dict)
    """
    root = find_sentinel_dataset_path()
    if not root:
        raise FileNotFoundError("CSIRO Sentinel-1 dataset folder not found.")

    class_folder = f"Class_{class_label}"
    target_dir = Path(root) / "kaggle" / "data" / class_folder

    if chip_name:
        chip_path = target_dir / chip_name
        if not chip_path.exists():
            raise FileNotFoundError(f"Chip {chip_name} not found in {target_dir}")
    else:
        files = sorted(list(target_dir.glob("*.jpg")))
        if not files:
            raise FileNotFoundError(f"No chips found in {target_dir}")
        chip_path = files[index % len(files)]

    img = Image.open(chip_path).convert("L")
    if target_size and img.size != target_size:
        img = img.resize(target_size, Image.Resampling.BILINEAR)

    arr = np.array(img, dtype=np.uint8)
    db_data = calibrate_uint8_to_db(arr)

    meta = {
        "chip_name": chip_path.name,
        "class_label": class_label,
        "class_name": "Oil Spill Feature" if class_label == 1 else "Clean Sea / Look-alike",
        "dataset_doi": CSIRO_DOI,
        "dataset_title": CSIRO_TITLE,
        "width": db_data.shape[1],
        "height": db_data.shape[0],
        "min_db": float(np.min(db_data)),
        "max_db": float(np.max(db_data)),
        "mean_db": float(np.mean(db_data)),
        "calibrated_unit": "decibel (dB)"
    }

    return db_data, meta
