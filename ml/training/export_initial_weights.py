"""
Offline Training & Checkpoint Export Utility for MARS U-Net Model.
Exports an initialized PyTorch state_dict into models/oil_spill_unet.pt.
"""
import os
import sys

# Ensure repo root is on sys.path
sys.path.insert(0, os.path.abspath("."))

import torch
from ml.models.unet import UNet

def export_checkpoint():
    os.makedirs("models", exist_ok=True)
    out_path = os.path.join("models", "oil_spill_unet.pt")

    model = UNet(in_channels=1, num_classes=1)
    # Initialize with Xavier normal weights
    for m in model.modules():
        if isinstance(m, torch.nn.Conv2d):
            torch.nn.init.xavier_normal_(m.weight)

    torch.save(model.state_dict(), out_path)
    print(f"Successfully exported initial U-Net model checkpoint to: {out_path}")

if __name__ == "__main__":
    export_checkpoint()
