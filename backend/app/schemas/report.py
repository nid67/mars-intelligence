"""
Forensic Investigation Report and Summary Schemas.
Adheres strictly to scientific neutrality and non-certainty guidelines.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.schemas.investigation import InvestigationResponse
from backend.app.schemas.spill import SpillResponse
from backend.app.schemas.attribution import CandidateAssessmentResponse


class InvestigationSummaryResponse(BaseModel):
    investigation: InvestigationResponse
    data_mode: str
    spill: Optional[SpillResponse] = None
    observation_metadata: Optional[Dict[str, Any]] = None
    probable_origin_region: Optional[Dict[str, Any]] = None
    estimated_release_window: Optional[Dict[str, Any]] = None
    environmental_summary: Optional[Dict[str, Any]] = None
    candidate_ranking: List[CandidateAssessmentResponse] = []
    top_candidate: Optional[CandidateAssessmentResponse] = None
    structured_uncertainty: Dict[str, float] = Field(default_factory=dict)
    data_sources: List[Dict[str, Any]] = []
    forensic_status: str = "COMPLETED"


class SectionReport(BaseModel):
    title: str
    content: str
    key_metrics: Dict[str, Any] = Field(default_factory=dict)
    caveats: Optional[List[str]] = None


class ForensicInvestigationReport(BaseModel):
    report_id: str
    investigation_id: str
    generated_at: datetime
    title: str
    region: str
    data_mode: str

    executive_summary: SectionReport
    spill_detection: SectionReport
    spill_characterization: SectionReport
    origin_reconstruction: SectionReport
    release_window: SectionReport
    environmental_conditions: SectionReport
    vessel_candidates: SectionReport
    attribution_scores: SectionReport
    supporting_evidence: SectionReport
    contradicting_evidence: SectionReport
    uncertainty_analysis: SectionReport
    data_sources_transparency: SectionReport
    scientific_limitations: SectionReport

    legal_disclaimer: str = (
        "LEGAL NOTICE & SCIENTIFIC CAVEAT: This investigation dossier provides objective, "
        "deterministic forensic screening scores based on spatial, temporal, physical drift, "
        "and AIS correlation models. Under no circumstances does this report establish legal "
        "guilt, operational fault, or regulatory liability. Results must be independently corroborated "
        "by maritime law enforcement authorities with physical sampling and port state inspection."
    )
