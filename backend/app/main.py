"""
MARS Backend Main Application.
FastAPI Application Entrypoint for Maritime Forensic Platform (SIH26143).
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.core.database import Base, engine
from backend.app.core.logging import logger
import backend.app.models  # Ensure all SQLAlchemy models are registered

# Import API Routers
from backend.app.api.health import router as health_router
from backend.app.api.investigations import router as investigations_router
from backend.app.api.spills import router as spills_router
from backend.app.api.vessels import router as vessels_router
from backend.app.api.ais import router as ais_router
from backend.app.api.drift import router as drift_router
from backend.app.api.attribution import router as attribution_router
from backend.app.api.evidence import router as evidence_router
from backend.app.api.data import router as data_router
from backend.app.api.demo import router as demo_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist
    logger.info("Initializing database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
    yield
    # Shutdown
    logger.info("Shutting down MARS backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Production-structured Maritime Forensic Intelligence Platform for SIH26143: "
        "Oil Spill Detection & Vessel Attribution. "
        "Operates strictly under scientific non-certainty and forensic neutrality."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api/v1
v1_prefix = settings.API_V1_PREFIX
app.include_router(health_router, prefix=v1_prefix)
app.include_router(investigations_router, prefix=v1_prefix)
app.include_router(spills_router, prefix=v1_prefix)
app.include_router(vessels_router, prefix=v1_prefix)
app.include_router(ais_router, prefix=v1_prefix)
app.include_router(drift_router, prefix=v1_prefix)
app.include_router(attribution_router, prefix=v1_prefix)
app.include_router(evidence_router, prefix=v1_prefix)
app.include_router(data_router, prefix=v1_prefix)
app.include_router(demo_router, prefix=v1_prefix)


@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "sih_problem": "SIH26143 — Oil Spill Detection & Vessel Attribution",
        "status": "OPERATIONAL",
        "documentation": "/docs",
        "openapi_schema": "/openapi.json",
        "active_data_mode": settings.DATA_MODE.value,
        "legal_neutrality_notice": "Outputs are evidentiary screening indices. Under no circumstances do outputs claim legal responsibility or certainty."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
