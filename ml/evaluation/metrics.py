"""
Forensic Evaluation Metrics Module.
Calculates IoU, Dice, classification accuracy, look-alike rejection rate,
and geometric error metrics (centroid error in km, area discrepancy).
"""
from typing import Dict, Any, List, Optional
import numpy as np


def calculate_segmentation_metrics(pred_mask: np.ndarray, gt_mask: np.ndarray) -> Dict[str, float]:
    """Computes IoU (Jaccard Index), Dice coefficient, precision, recall, and pixel accuracy."""
    pred = pred_mask.astype(bool)
    gt = gt_mask.astype(bool)

    intersection = np.logical_and(pred, gt).sum()
    union = np.logical_or(pred, gt).sum()

    iou = float(intersection / union) if union > 0 else 1.0
    dice = float((2.0 * intersection) / (pred.sum() + gt.sum())) if (pred.sum() + gt.sum()) > 0 else 1.0

    tp = float(intersection)
    fp = float(np.logical_and(pred, ~gt).sum())
    fn = float(np.logical_and(~pred, gt).sum())
    tn = float(np.logical_and(~pred, ~gt).sum())

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    pixel_acc = (tp + tn) / float(pred.size) if pred.size > 0 else 1.0

    return {
        "iou": round(iou, 4),
        "dice": round(dice, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "pixel_accuracy": round(pixel_acc, 4)
    }


def calculate_forensic_geometric_errors(
    pred_centroid: List[float],
    gt_centroid: List[float],
    pred_area_sqkm: float,
    gt_area_sqkm: float
) -> Dict[str, float]:
    """Computes centroid offset error in kilometers and percentage area error."""
    # Approximate Haversine / Euclidean in km (at equator 1 deg ~ 111 km)
    dlon = (pred_centroid[0] - gt_centroid[0]) * 111.0 * np.cos(np.radians(gt_centroid[1]))
    dlat = (pred_centroid[1] - gt_centroid[1]) * 111.0
    centroid_err_km = float(np.sqrt(dlon**2 + dlat**2))

    area_err_pct = float(abs(pred_area_sqkm - gt_area_sqkm) / max(gt_area_sqkm, 1e-3)) * 100.0

    return {
        "centroid_error_km": round(centroid_err_km, 3),
        "area_error_sqkm": round(abs(pred_area_sqkm - gt_area_sqkm), 2),
        "area_error_percentage": round(area_err_pct, 2)
    }


def calculate_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_probs: Any = None
) -> Dict[str, Any]:
    """Computes binary classification accuracy, precision, recall, F1, and look-alike rejection rate."""
    y_t = np.array(y_true).astype(int)
    y_p = np.array(y_pred).astype(int)

    tp = float(np.sum((y_t == 1) & (y_p == 1)))
    fp = float(np.sum((y_t == 0) & (y_p == 1)))
    fn = float(np.sum((y_t == 1) & (y_p == 0)))
    tn = float(np.sum((y_t == 0) & (y_p == 0)))

    accuracy = (tp + tn) / max(1.0, float(len(y_t)))
    precision = tp / max(1.0, tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / max(1.0, tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2.0 * precision * recall) / max(1e-6, precision + recall) if (precision + recall) > 0 else 0.0
    look_alike_rejection_rate = tn / max(1.0, tn + fp) if (tn + fp) > 0 else 1.0

    return {
        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1": round(float(f1), 4),
        "look_alike_rejection_rate": round(float(look_alike_rejection_rate), 4),
        "true_positives": int(tp),
        "false_positives": int(fp),
        "false_negatives": int(fn),
        "true_negatives": int(tn)
    }

