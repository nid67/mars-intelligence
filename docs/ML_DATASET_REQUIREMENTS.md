# MARS Machine Learning Dataset Requirements & Strategy

**Project**: MARS — Maritime Intelligence & Forensic Investigation Platform  
**Problem Statement**: SIH26143 — Oil Spill Detection & Vessel Attribution  
**Document Version**: 1.0.0 (Production & Hackathon Roadmap)

---

## Executive Summary & Current Repository Audit

Prior to defining dataset acquisition guidelines, an audit of the current environment and repository was conducted:
1. **Existing Models & Checkpoints**: No local `.pt` / `.onnx` model weights are currently pre-loaded in the repo.
2. **Current Datasets**: No large raster archives or raw mask datasets are bundled locally, adhering strictly to the **Data Access Philosophy** (API-first, lightweight footprint).
3. **Execution State**: MARS operates in dual-mode:
   - **Trained Model Mode**: Loads PyTorch checkpoint (`models/oil_spill_unet.pt` or `models/oil_spill_classifier.pt`).
   - **Demonstration Fallback Mode (`model_mode: DEMONSTRATION_FALLBACK`)**: Employs an adaptive CFAR (Constant False Alarm Rate) SAR dark-formation detector with morphological filtering and connected-component polygonization. This ensures 100% end-to-end functionality without faking AI performance.

---

## 1. Required Tasks

MARS requires two distinct ML vision tasks:

### Task A: Patch/Tile Level Classification (Binary & Multi-Class)
- **Objective**: Determine whether a candidate SAR sub-scene/patch contains a potential oil spill versus clean water or look-alike phenomena.
- **Output**: Class label and probability $P(\text{spill} \mid \mathbf{X}) \in [0, 1]$.
- **Architectural Distinction**: Tile classification identifies *candidate regions of interest* ($\sim 5\text{ km} \times 5\text{ km}$ tiles). It **does not** generate pixel-level spill boundaries.

### Task B: Semantic Segmentation (Pixel-Level)
- **Objective**: Delineate exact pixel masks of dark formations corresponding to potential oil slicks on Sentinel-1 SAR imagery.
- **Output**: Binary mask $\mathbf{M} \in \{0, 1\}^{H \times W}$ (or multi-class logits: background, potential oil, look-alike, ship wake, land).
- **Architectural Distinction**: Segmentation provides the geometric ground truth required to extract connected components, polygon contours, centroid, area ($\text{km}^2$), perimeter, elongation, and orientation for the drift and attribution engines.

### Task C: Object Detection (Vessels & Spill Clusters - Optional/Phase 2)
- **Objective**: Bounding-box detection of high-backscatter point targets (vessels/platforms) and low-backscatter slick clusters (YOLOv8-OBB / Faster R-CNN).

---

## 2. Required Labels & Class Schema

To ensure scientific honesty and prevent false attribution, labels must distinguish between true mineral oil slicks and common look-alikes.

| Class ID | Class Name | Description | Optical/SAR Characteristic |
| :--- | :--- | :--- | :--- |
| `0` | `Background / Clean Sea` | Open sea surface under moderate wind ($3\text{--}12\text{ m/s}$) | Homogeneous moderate backscatter ($\sim -18\text{ dB}$ to $-12\text{ dB}$) |
| `1` | `Potential Oil Spill` | Mineral hydrocarbon slick dampening capillary-gravity waves | Sharp-edged, high contrast dark formation ($\Delta \sigma_0 > 4\text{ dB}$) |
| `2` | `Look-Alike (Biogenic / Low-Wind)` | Biogenic natural films, grease ice, or calm water wind shadows ($<3\text{ m/s}$) | Diffuse boundaries, feathering, wide regional extent |
| `3` | `Ship / Platform` | Hard metallic maritime targets producing corner reflections | Very high intensity backscatter spikes ($\sigma_0 > 0\text{ dB}$) |
| `4` | `Ship Wake` | Turbulent or Kelvin wake behind moving vessels | V-shaped or linear contrasting dark/bright tracks |
| `5` | `Land / Coastline` | Coastal topography, mudflats, and port structures | Masked out via high-resolution shoreline vectors |

---

## 3. Evaluation of Publicly Available Datasets

### A. CSIRO Sentinel-1 Oil/No-Oil Dataset (Integrated in MARS)
- **Source & DOI**: CSIRO Data Access Portal, DOI: [10.25919/4v55-dn16](https://doi.org/10.25919/4v55-dn16) (Blondeau-Patissier et al., 2022).
- **Local Path**: Discovered automatically at `sentinal-ds/kaggle/data/` or `sentinel-ds/kaggle/data/`.
- **Composition**: 5,538 active 400x400 single-band JPEG chips:
  - `Class_0` (3,695 chips): Clean sea / look-alike (biogenic slicks, low wind).
  - `Class_1` (1,843 chips): Confirmed Sentinel-1 SAR oil slick features.
- **MARS Implementation**:
  - Ingestion & Calibration: `backend/app/providers/demo/sentinel_dataset.py` calibrates 8-bit values to $\sigma^0_{\text{dB}} \in [-28.0, -4.0]\text{ dB}$.
  - Model Architecture: `ml/models/classifier.py` (`PatchClassifier` with 3 conv blocks + adaptive pooling).
  - Training Pipeline: `ml/training/train_classifier.py` evaluates Accuracy, Precision, Recall, F1, and look-alike rejection rate, saving checkpoint to `models/oil_spill_classifier.pt`.
  - Inference: `ml/inference/infer.py` executes tile-level classification returning $P(\text{oil})$ oil probability and confidence.
  - Scientific Honesty: Strictly preserved as tile-level binary classification; pixel-level polygon boundaries are extracted via U-Net or Adaptive CFAR, never claiming pixel ground truth from CSIRO chips.


### B. Zenodo Sentinel-1 Oil Spill Segmentation Datasets (e.g., Kaloorazi et al. / Singha et al.)
- **Format**: Sentinel-1 Level-1 GRD patches ($256 \times 256$ or $512 \times 512$) with manual/expert pixel-level binary annotations.
- **Strengths**: True pixel masks; Sentinel-1 IW mode VV/VH polarization; ground-truthed by maritime authorities (EMSA CleanSeaNet / NOAA).
- **Limitations**: Modest geographic coverage (primarily Mediterranean and North Sea).
- **Prescribed Use in MARS**: Primary dataset for U-Net / U-Net++ segmentation baseline training.

### C. Eastern Mediterranean Sentinel-1 Oil and Look-Alike Dataset
- **Format**: Labeled SAR tiles containing verified oil slicks, natural look-alikes (algal blooms, low-wind areas), and ships.
- **Strengths**: Critical for training the false-positive rejection engine; multi-class labeling.
- **Prescribed Use in MARS**: Look-alike risk assessment model and false-positive filter calibration.

### D. EG-OilSpill Dataset
- **Format**: Fine-resolution SAR segmentation dataset with verified coastal and offshore spill events.
- **Prescribed Use in MARS**: Benchmark validation for fine boundary extraction and elongation/orientation metrics.

---

## 4. Dataset Comparison Matrix

| Dataset | Modality & Polarization | Labels Provided | Geographic Extent | License | Approx Size | Recommended Task |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CSIRO Sentinel-1** | S1 C-SAR (VV, VH) | Tile-level (Oil/No-Oil) | Global (Offshore) | Open Access / CC-BY | $\sim 15\text{ GB}$ | Binary Classification & Pretraining |
| **Zenodo S1 Spill** | S1 GRD (VV dominant) | Pixel-level binary masks | European Seas / Med | CC-BY 4.0 | $\sim 3\text{--}8\text{ GB}$ | U-Net Semantic Segmentation |
| **Eastern Med Look-Alike**| S1 GRD (VV, VH) | Pixel masks + Look-alike | East Mediterranean | Academic / Open | $\sim 5\text{ GB}$ | Multi-class / False Positive Filter |
| **EG-OilSpill** | S1 / Envisat ASAR | Pixel-level polygons | Mediterranean / Red Sea | Research Use | $\sim 2\text{ GB}$ | Geometric Characterization Benchmarking |

---

## 5. Indian Maritime Domain Adaptation Strategy

The oceanographic and meteorological dynamics of the Indian Ocean, Arabian Sea, and Bay of Bengal differ substantially from temperate European waters:
- **Monsoonal Wind Regimes**: Heavy southwest (June–Sept) and northeast (Oct–Dec) monsoons produce rough sea states ($\sigma_0$ saturation), interspersed with inter-monsoon doldrums (widespread calm waters with look-alike wind shadows).
- **Tropical River Discharges**: Heavy sediment and freshwater plumes from the Ganges-Brahmaputra, Indus, and Godavari create surface current shear and surfactant slicks.
- **High Vessel Density**: Intense coastal fishing fleet traffic alongside deep-draft supertankers transiting the SLOC (Sea Lines of Communication) between the Persian Gulf and Malacca Strait.

### Adaptation Pipeline
```
Global Base Training (CSIRO / Zenodo / East Med)
           ↓
Base Feature Representation (ResNet / EfficientNet Encoder)
           ↓
Indian Maritime Calibration Data (Curated SAR acquisitions: Arabian Sea, Bay of Bengal, Andaman)
           ↓
Fine-Tuned MARS Segmentation & Classification Engine
           ↓
Unseen Indian Operational Test Split
           ↓
Forensic Evaluation & Threshold Calibration
```

> [!WARNING]
> **Scientific Honesty Rule**: Synthetic SAR augmentations or unverified European models must **never** be cited as validated Indian operational accuracy. If Indian ground-truth validation samples are limited, the system explicitly reports:
> `domain_adaptation_status: UNVALIDATED_INDIAN_WATERS (EXPERIMENTAL)`

---

## 6. Train, Validation & Test Splitting Strategy

### Zero-Leakage Protocol
1. **Never Randomly Split Patches**: Splitting adjacent $256 \times 256$ tiles from the same Sentinel-1 acquisition scene across train and test causes catastrophic spatial data leakage and yields artificially inflated accuracy metrics.
2. **Scene-Level & Event-Level Splitting**: Splits must be grouped strictly by:
   - Unique Sentinel-1 Scene ID / Orbit
   - Distinct geographic region / basin
   - Incident timestamp (temporal holdout)
3. **Indian Test Holdout**: All Indian coastal validation scenes must remain completely excluded from training and validation sets to serve as pure zero-leakage evaluation targets.

---

## 7. Normalized Ingestion Directory Format

When external datasets are ingested for offline training, they are transformed into the unified MARS schema:

```
data/normalized_ml/
├── metadata.csv
├── images/
│   ├── S1A_IW_GRDH_1SDV_20260115_tile_001_VV.tif
│   └── S1A_IW_GRDH_1SDV_20260115_tile_001_VH.tif
├── masks/
│   └── S1A_IW_GRDH_1SDV_20260115_tile_001_mask.png (0: bg, 1: oil, 2: look-alike, 3: ship)
└── labels/
    └── S1A_IW_GRDH_1SDV_20260115_tile_001.json
```

Each record in `metadata.csv` contains:
`image_id, source_dataset, scene_id, acquisition_timestamp, min_lat, min_lon, max_lat, max_lon, polarization, resolution_m, wind_speed_mps, label_type, license, annotation_source`.

---

## 8. SIH 2026 Prototype vs. Final System Recommendations

### For the SIH Working Prototype (Immediate Goal)
- **Do NOT download huge multi-gigabyte archives.**
- Use the **MARS Modular Dual Detector**:
  1. Default: High-efficiency **Adaptive CFAR & Morphological SAR Detector** (`model_mode: DEMONSTRATION_FALLBACK`) operating on raster inputs with calibrated contrast and dark-spot thresholding.
  2. PyTorch Checkpoint Support: If a lightweight pre-trained checkpoint (`models/oil_spill_unet.pt`) is present, the engine automatically activates deep learning inference.
- Run deterministic verification scenarios for Arabian Sea, Bay of Bengal, Andaman Sea, and Ennore.

### For the Full Production Deployment (Post-Hackathon)
- Ingest Zenodo Sentinel-1 segmentation ($3.5\text{ GB}$) and Eastern Med look-alikes ($4\text{ GB}$).
- Execute offline transfer learning using PyTorch with a ResNet34 backbone U-Net.
- Curate 50+ Sentinel-1 scenes covering Indian EEZ waters under varying monsoonal states with INCOIS (Indian National Centre for Ocean Information Services) oceanographic validation.
