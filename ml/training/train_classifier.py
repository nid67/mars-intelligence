"""
PyTorch Training and Evaluation Script for Sentinel-1 PatchClassifier.
Trains on CSIRO Sentinel-1 SAR Oil/No-Oil image chips dataset (DOI: 10.25919/4v55-dn16).
Class 0: Clean sea / Look-alikes (low-wind, biogenic slicks).
Class 1: Confirmed oil spill features.
"""
import os
import sys
import argparse
import random
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath("."))

import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

from ml.models.classifier import PatchClassifier
from ml.evaluation.metrics import calculate_classification_metrics
from backend.app.providers.demo.sentinel_dataset import find_sentinel_dataset_path, calibrate_uint8_to_db
from backend.app.core.logging import logger


class SentinelSARDataset(Dataset):
    """PyTorch Dataset loading CSIRO Sentinel-1 SAR chips."""
    def __init__(
        self,
        file_paths: List[Tuple[Path, int]],
        target_size: Tuple[int, int] = (128, 128),
        augment: bool = False
    ):
        self.file_paths = file_paths
        self.target_size = target_size
        self.augment = augment

    def __len__(self) -> int:
        return len(self.file_paths)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        img_path, label = self.file_paths[idx]
        img = Image.open(img_path).convert("L")

        if self.target_size and img.size != self.target_size:
            img = img.resize(self.target_size, Image.Resampling.BILINEAR)

        arr = np.array(img, dtype=np.uint8)

        # Convert to calibrated dB then normalize to [0, 1]
        db_arr = calibrate_uint8_to_db(arr, db_min=-28.0, db_max=-4.0)
        norm_arr = np.clip((db_arr - (-28.0)) / ((-4.0) - (-28.0)), 0.0, 1.0).astype(np.float32)

        # Data augmentation for training
        if self.augment:
            if random.random() > 0.5:
                norm_arr = np.fliplr(norm_arr).copy()
            if random.random() > 0.5:
                norm_arr = np.flipud(norm_arr).copy()
            k = random.randint(0, 3)
            if k > 0:
                norm_arr = np.rot90(norm_arr, k).copy()

        tensor = torch.from_numpy(norm_arr).unsqueeze(0)  # (1, H, W)
        target = torch.tensor(label, dtype=torch.long)
        return tensor, target


def collect_dataset_files(
    root_dir: str,
    max_per_class: Optional[int] = None,
    use_sample_only: bool = False
) -> List[Tuple[Path, int]]:
    """Gathers image paths and binary labels (0 or 1)."""
    base = Path(root_dir) / "kaggle" / "data"
    if use_sample_only and (base / "sample").exists():
        base = base / "sample"

    c0_dir = base / "Class_0"
    c1_dir = base / "Class_1"

    c0_files = sorted(list(c0_dir.glob("*.jpg"))) if c0_dir.exists() else []
    c1_files = sorted(list(c1_dir.glob("*.jpg"))) if c1_dir.exists() else []

    if max_per_class:
        random.seed(42)
        random.shuffle(c0_files)
        random.shuffle(c1_files)
        c0_files = c0_files[:max_per_class]
        c1_files = c1_files[:max_per_class]

    samples = [(p, 0) for p in c0_files] + [(p, 1) for p in c1_files]
    random.seed(42)
    random.shuffle(samples)
    return samples


def train_classifier(
    data_dir: Optional[str] = None,
    output_path: str = "models/oil_spill_classifier.pt",
    epochs: int = 5,
    batch_size: int = 16,
    lr: float = 1e-3,
    max_per_class: Optional[int] = 100,
    val_split: float = 0.2,
    img_size: int = 128,
    use_sample_only: bool = False,
    device_name: str = "cpu"
) -> Dict[str, Any]:
    """Trains the PatchClassifier and returns final evaluation metrics."""
    if not data_dir:
        data_dir = find_sentinel_dataset_path()
    if not data_dir:
        raise FileNotFoundError("Could not find Sentinel-1 dataset directory.")

    device = torch.device(device_name)
    all_files = collect_dataset_files(data_dir, max_per_class=max_per_class, use_sample_only=use_sample_only)

    if not all_files:
        raise ValueError(f"No image files found in {data_dir}")

    # Split train / val
    split_idx = int(len(all_files) * (1.0 - val_split))
    train_files = all_files[:split_idx]
    val_files = all_files[split_idx:]

    print(f"Dataset: Total={len(all_files)}, Train={len(train_files)}, Val={len(val_files)}")

    train_ds = SentinelSARDataset(train_files, target_size=(img_size, img_size), augment=True)
    val_ds = SentinelSARDataset(val_files, target_size=(img_size, img_size), augment=False)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)

    model = PatchClassifier(in_channels=1, num_classes=2).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    best_val_f1 = -1.0
    final_metrics: Dict[str, Any] = {}

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            out = model(x)
            loss = criterion(out, y)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * len(y)

        train_loss = running_loss / max(1, len(train_files))

        # Evaluate on validation set
        model.eval()
        val_preds: List[int] = []
        val_targets: List[int] = []
        val_probs: List[float] = []

        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                out = model(x)
                probs = torch.softmax(out, dim=1)
                preds = torch.argmax(probs, dim=1)
                val_preds.extend(preds.cpu().numpy().tolist())
                val_targets.extend(y.cpu().numpy().tolist())
                val_probs.extend(probs[:, 1].cpu().numpy().tolist())

        val_metrics = calculate_classification_metrics(
            np.array(val_targets),
            np.array(val_preds),
            np.array(val_probs)
        )
        print(f"Epoch {epoch}/{epochs} - Loss: {train_loss:.4f} | Val Acc: {val_metrics['accuracy']:.3f} | F1: {val_metrics['f1']:.3f} | Precision: {val_metrics['precision']:.3f} | Recall: {val_metrics['recall']:.3f}")

        if val_metrics["f1"] >= best_val_f1 or epoch == epochs:
            best_val_f1 = val_metrics["f1"]
            final_metrics = val_metrics

    # Save model weights
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    torch.save(model.state_dict(), output_path)
    print(f"Successfully saved trained classifier checkpoint to: {output_path}")

    return {
        "output_path": output_path,
        "epochs": epochs,
        "train_samples": len(train_files),
        "val_samples": len(val_files),
        "metrics": final_metrics
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train MARS Sentinel-1 SAR PatchClassifier")
    parser.add_argument("--data_dir", type=str, default=None, help="Root folder of sentinal-ds")
    parser.add_argument("--output", type=str, default="models/oil_spill_classifier.pt")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--max_per_class", type=int, default=100)
    parser.add_argument("--img_size", type=int, default=128)
    parser.add_argument("--sample_only", action="store_true")
    args = parser.parse_args()

    train_classifier(
        data_dir=args.data_dir,
        output_path=args.output,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        max_per_class=args.max_per_class,
        img_size=args.img_size,
        use_sample_only=args.sample_only
    )
