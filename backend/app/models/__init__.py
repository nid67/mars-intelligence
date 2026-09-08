"""
MARS SQLAlchemy Models Package.
"""
from backend.app.models.investigation import Investigation
from backend.app.models.satellite import SatelliteObservation
from backend.app.models.spill import SpillDetection
from backend.app.models.vessel import Vessel
from backend.app.models.ais import AISPosition
from backend.app.models.environment import EnvironmentalObservation
from backend.app.models.drift import DriftRun
from backend.app.models.assessment import CandidateAssessment
from backend.app.models.evidence import Evidence
from backend.app.models.model_run import ModelRun
from backend.app.models.datasource import DataSource

__all__ = [
    "Investigation",
    "SatelliteObservation",
    "SpillDetection",
    "Vessel",
    "AISPosition",
    "EnvironmentalObservation",
    "DriftRun",
    "CandidateAssessment",
    "Evidence",
    "ModelRun",
    "DataSource",
]
