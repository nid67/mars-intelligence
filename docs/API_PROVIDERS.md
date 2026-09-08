# MARS External API Providers & Authentication Guide

**Project**: MARS — Maritime Intelligence & Forensic Investigation Platform  
**Problem Statement**: SIH26143 — Oil Spill Detection & Vessel Attribution  

---

## 1. Provider Architecture & Factory Pattern

MARS decouples business logic from external data providers via abstract interfaces. Core processing engines (Drift, Attribution, Evidence, GIS) consume **Normalized Domain Models** and remain agnostic to the underlying provider.

```
                  ┌──────────────────────┐
                  │    Core Engines      │
                  └──────────┬───────────┘
                             │ Consumes Normalized Models
                 ┌───────────┴───────────┐
                 │  Provider Interfaces  │
                 │   (providers/base/)   │
                 └───────────┬───────────┘
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Mode: REAL_API  │ │  Mode: HYBRID    │ │Mode: DEMONSTRATION│
│ (CDSE/CMEMS/GFW) │ │ (Real Sat + Demo)│ │(Deterministic Syn)│
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## 2. Satellite Provider: Copernicus Data Space Ecosystem (CDSE)

### Implementation: `backend/app/providers/copernicus/satellite.py`

- **Endpoint**:
  - Auth: `https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token`
  - Catalogue: `https://catalogue.dataspace.copernicus.eu/odata/v1/Products`
- **Authentication**:
  - Grant Type: `client_credentials`
  - Client ID: `$COPERNICUS_CLIENT_ID`
  - Client Secret: `$COPERNICUS_CLIENT_SECRET`
- **Query Filter**:
  ```
  $filter=OData.CSC.Intersects(area=geography'SRID=4326;POLYGON((...))') 
  and ContentDate/Start ge 2026-01-01T00:00:00.000Z 
  and ContentDate/Start le 2026-01-02T00:00:00.000Z 
  and contains(Name,'GRD') 
  and contains(Name,'IW')
  ```
- **Error & Fallback Handling**:
  If credentials are missing or token acquisition fails, the provider logs an audit event and falls back to the deterministic demonstration provider while marking `source_status: FALLBACK` and `data_mode: DEMONSTRATION`.

---

## 3. Environmental Provider: Copernicus Marine Service (CMEMS)

### Implementation: `backend/app/providers/marine/environmental.py`

- **Python Client**: `copernicusmarine` official SDK.
- **Environment Variables**:
  - `COPERNICUS_MARINE_USERNAME`
  - `COPERNICUS_MARINE_PASSWORD`
  - `COPERNICUS_MARINE_CURRENT_DATASET` (Default: `cmems_mod_glo_phy_anfc_0.083deg_P1D-m`)
  - `COPERNICUS_MARINE_WIND_DATASET` (Default: `cmems_obs-wind_glo_phy_my_l4_0.125deg_P1D`)
- **Query Method**:
  ```python
  copernicusmarine.subset(
      dataset_id=dataset_id,
      variables=["uo", "vo"],
      minimum_longitude=min_lon,
      maximum_longitude=max_lon,
      minimum_latitude=min_lat,
      maximum_latitude=max_lat,
      start_datetime=start_time,
      end_datetime=end_time,
      output_filename=cache_file
  )
  ```
- **Normalization**:
  Returned NetCDF/Zarr arrays are parsed into uniform `EnvironmentalField` grids containing $(u_{\text{current}}, v_{\text{current}}, u_{\text{wind}}, v_{\text{wind}})$.

---

## 4. AIS Provider: Global Fishing Watch (GFW)

### Implementation: `backend/app/providers/ais/gfw.py`

- **Endpoint**: `https://gateway.globalfishingwatch.org/v3/`
- **Authentication**: `Authorization: Bearer <GFW_API_TOKEN>`
- **Security Rule**: API tokens are **strictly server-side**. They are never returned in client API payloads, never embedded in GeoJSON properties, and never passed to frontend browsers.
- **Graceful Trajectory Handling**:
  The GFW REST API primarily exposes vessel identification, aggregated fishing effort, and port entry events. If historical sub-hourly raw trajectory queries are restricted for the requested AOI/time, the provider returns verified identity metadata and merges with historical/demo tracks, logging:
  `"GFW raw trajectory not permitted under current API tier; activated local trajectory reconstruction"`.

---

## 5. System Readiness & Capability Introspection

The endpoint `GET /api/v1/system/capabilities` returns the live operational status of all providers without exposing secrets:

```json
{
  "system_time": "2026-09-08T22:50:00Z",
  "active_data_mode": "HYBRID",
  "satellite": {
    "copernicus_cdse": {
      "configured": false,
      "authenticated": false,
      "status": "MISSING_CREDENTIALS"
    },
    "demo_provider": {
      "configured": true,
      "authenticated": true,
      "status": "OPERATIONAL"
    }
  },
  "environmental": {
    "copernicus_marine": {
      "configured": false,
      "authenticated": false,
      "status": "MISSING_CREDENTIALS"
    },
    "demo_provider": {
      "configured": true,
      "authenticated": true,
      "status": "OPERATIONAL"
    }
  },
  "ais": {
    "global_fishing_watch": {
      "configured": false,
      "authenticated": false,
      "status": "MISSING_TOKEN"
    },
    "demo_provider": {
      "configured": true,
      "authenticated": true,
      "status": "OPERATIONAL"
    }
  },
  "ml": {
    "model_mode": "DEMONSTRATION_FALLBACK",
    "checkpoint_loaded": false,
    "cfar_detector_active": true
  }
}
```
