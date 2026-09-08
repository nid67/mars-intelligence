# MARS Data Sources & Ingestion Strategy

**Project**: MARS — Maritime Intelligence & Forensic Investigation Platform  
**Problem Statement**: SIH26143 — Oil Spill Detection & Vessel Attribution  

---

## 1. Overview
MARS operates under an **API-First & Spatial-Temporal Subsetting Philosophy**. Massive global satellite or oceanographic archives are never downloaded into the repository. Instead, each forensic investigation queries remote providers strictly for the bounding box (AOI) and temporal window of interest.

---

## 2. Satellite Data: Copernicus Sentinel-1 Synthetic Aperture Radar (SAR)

### Provider: Copernicus Data Space Ecosystem (CDSE)
- **Sensor**: Sentinel-1 C-band Synthetic Aperture Radar (C-SAR).
- **Product Type**: Level-1 Ground Range Detected (GRD), Interferometric Wide Swath (IW).
- **Polarization**: Dual-polarization VV + VH (with VV serving as the primary channel for oil slick contrast).
- **Spatial Resolution**: $10\text{ m} \times 10\text{ m}$ pixel spacing.
- **Acquisition Revisit**: $6\text{--}12\text{ days}$ depending on orbit pass.
- **Authentication**: OpenID Connect OAuth2 Client Credentials via `https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token`.
- **Search API**: OData v4 / STAC API (`https://catalogue.dataspace.copernicus.eu/odata/v1/Products`).
- **Subsetting**: Bounding-box clipped raster or tile via Sentinel Hub / CDSE Process API.
- **Fallback**: High-resolution synthetic SAR raster generator (`providers/demo/satellite.py`) with calibrated ocean surface backscatter, dark slick damping, and speckle noise.

---

## 3. Oceanographic & Atmospheric Environmental Data

### Provider: Copernicus Marine Service (CMEMS)
- **Product**: Global Ocean Physics Analysis and Forecast (`GLOBAL_ANALYSISFORECAST_PHY_001_024` or configurable through `COPERNICUS_MARINE_CURRENT_DATASET`).
- **Variables**:
  - `uo`: Surface Eastward Seawater Velocity ($\text{m/s}$)
  - `vo`: Surface Northward Seawater Velocity ($\text{m/s}$)
  - `zos`: Sea surface height above geoid ($\text{m}$)
  - `thetao`: Sea water potential temperature ($^\circ\text{C}$, optional)
- **Atmospheric Wind**: Global Atmospheric ECMWF forcing / Copernicus Marine Wind (`WIND_GLO_PHY_L4_NRT_012_004` or configurable).
  - `eastward_wind`: $10\text{m}$ eastward wind component ($u_{10}$, $\text{m/s}$)
  - `northward_wind`: $10\text{m}$ northward wind component ($v_{10}$, $\text{m/s}$)
- **Resolution**: $0.083^\circ \times 0.083^\circ$ ($\sim 9\text{ km}$) physics grid; hourly/daily temporal steps.
- **Python Client**: `copernicusmarine` official library with subsetting queries.
- **Fallback**: Spatially varying hydrodynamic vector field generator (`providers/demo/environmental.py`) calculating realistic tidal and regional monsoonal gyres.

---

## 4. Automatic Identification System (AIS) Vessel Tracking

### Provider: Global Fishing Watch (GFW) & Maritime Registries
- **Endpoints**: GFW Vessels and Events API (`https://gateway.globalfishingwatch.org/v3/`).
- **Authentication**: `Authorization: Bearer <GFW_API_TOKEN>`.
- **Capabilities**:
  - Vessel identity lookup (MMSI, IMO, Flag, Vessel Name, Ship Type, Tonnage).
  - Vessel activity summary and port events within AOI.
- **Trajectory Gap Handling**: Raw high-frequency historical position streams frequently encounter satellite line-of-sight obscuration or terrestrial receiver gaps. MARS calculates:
  $$\Delta t_{\text{gap}} = t_{i} - t_{i-1}$$
  Any interval $\Delta t_{\text{gap}} > 2.0\text{ hours}$ is flagged as an `AIS Gap`.
- **Forensic Neutrality**: An AIS gap is recorded as a **Data Quality Indicator**, not an automatic indicator of illegal activity or deliberate AIS tampering.
- **Fallback**: Curated deterministic vessel track generator (`providers/demo/ais.py`) generating realistic tanker, bulk carrier, and container ship transit tracks with controlled gaps.

---

## 5. Shoreline & Port Infrastructure

### Geography Provider
- High-resolution coastal vectors derived from Natural Earth and OpenStreetMap coastlines.
- Major and non-major Indian ports catalog (e.g., JNPT, Mumbai, Visakhapatnam, Paradip, Chennai, Ennore, Cochin, Kandla, Port Blair).
- Used for false-positive land masking and forward drift coastal impact proximity warnings.

---

## 6. Curated Local Sentinel SAR Dataset: CSIRO Sentinel-1 SAR Oil/No-Oil Chips

### Dataset Provenance & Ingestion
- **Source**: CSIRO Data Access Portal (Blondeau-Patissier et al., 2022).
- **DOI**: [10.25919/4v55-dn16](https://doi.org/10.25919/4v55-dn16).
- **Local Directories**: Discovered automatically at `sentinal-ds/` or `sentinel-ds/`.
- **Dataset Composition**:
  - `Class_0` (3,695 chips): Clean sea surface, low-wind damping areas, biogenic look-alikes.
  - `Class_1` (1,843 chips): Confirmed oil slick features extracted from processed Sentinel-1 SAR scenes.
  - `sample/`: Curated testing subset for rapid smoke verification.
  - Total: **5,538 authentic Sentinel-1 SAR image chips**.
- **Format**: 400x400 pixels, single-band radar backscatter (grayscale).
- **Decibel Calibration**:
  $$\sigma^0_{\text{dB}} = -28.0 + \left(\frac{\text{pixel}}{255.0}\right) \times 24.0$$
  Calibrates raw 8-bit values to physically realistic decibel ranges ($\sim -28\text{ dB}$ for deep slicks to $-4\text{ dB}$ for rough sea/reflectors).
- **Role in Platform**:
  1. **SAR Ingestion**: In `DEMONSTRATION` and `HYBRID` modes, loads real Sentinel-1 SAR chips into `RasterSubset`, preserving genuine ocean surface speckle and wave textures.
  2. **Tile Classification**: Evaluated by PyTorch `PatchClassifier` (`models/oil_spill_classifier.pt`) returning tile-level $P(\text{oil})$ oil probability.
  3. **Scientific Integrity**: Strictly preserved as tile-level classification labels (0 vs 1); boundary polygons are generated via segmentation (U-Net) or Adaptive CFAR, preventing false claims of pixel-level ground truth.
  4. **System Capabilities**: Availability, total chip counts, and DOI provenance are dynamically reported via `GET /api/v1/system/capabilities`.

