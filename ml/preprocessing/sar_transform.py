"""
SAR Preprocessing, Normalization and Speckle Filtering Utilities.
"""
import numpy as np
from scipy.ndimage import uniform_filter


def linear_to_db(linear_array: np.ndarray) -> np.ndarray:
    """Convert linear SAR intensity to decibel (dB) scale."""
    clamped = np.maximum(linear_array, 1e-7)
    return 10.0 * np.log10(clamped)


def db_to_normalized_tensor(db_array: np.ndarray, vmin: float = -28.0, vmax: float = -5.0) -> np.ndarray:
    """Normalize SAR backscatter in dB to [0, 1] range for neural network input."""
    clipped = np.clip(db_array, vmin, vmax)
    normalized = (clipped - vmin) / (vmax - vmin)
    return normalized.astype(np.float32)


def lee_speckle_filter(img: np.ndarray, size: int = 5) -> np.ndarray:
    """Enhanced Lee speckle filter for SAR imagery using local variance."""
    mean = uniform_filter(img, size=size)
    mean_sq = uniform_filter(img**2, size=size)
    var = np.maximum(mean_sq - mean**2, 0.0)

    # Estimate noise variance as median local variance
    noise_var = np.median(var) / 2.0
    weights = var / np.maximum(var + noise_var, 1e-6)
    filtered = mean + weights * (img - mean)
    return filtered
