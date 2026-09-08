"""
Attribution & Candidate Ranking API Router.
Provides endpoints to inspect candidate vessel assessments, attribution scores, and factor breakdowns.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.assessment import CandidateAssessment
from backend.app.models.evidence import Evidence
from backend.app.models.vessel import Vessel
from backend.app.schemas.attribution import CandidateAssessmentResponse, AttributionRankingResponse

router = APIRouter(prefix="/attribution", tags=["Attribution"])


@router.get("/investigations/{investigation_id}", response_model=AttributionRankingResponse)
def get_investigation_attribution(investigation_id: str, db: Session = Depends(get_db)):
    """Retrieve full candidate attribution ranking and breakdown for an investigation."""
    assessments = db.query(CandidateAssessment).filter(
        CandidateAssessment.investigation_id == investigation_id
    ).order_by(CandidateAssessment.candidate_rank).all()

    candidates_res = []
    for ass in assessments:
        vessel = db.query(Vessel).filter(Vessel.id == ass.vessel_id).first()
        ev_items = db.query(Evidence).filter(Evidence.candidate_assessment_id == ass.id).all()

        supp = [e for e in ev_items if e.direction == "SUPPORTING"]
        contra = [e for e in ev_items if e.direction == "CONTRADICTING"]

        candidates_res.append({
            "id": str(ass.id),
            "investigation_id": str(ass.investigation_id),
            "vessel_id": str(ass.vessel_id),
            "vessel": vessel,
            "attribution_score": ass.attribution_score,
            "candidate_rank": ass.candidate_rank,
            "investigation_priority": ass.investigation_priority,
            "origin_compatibility_score": ass.origin_compatibility_score,
            "temporal_compatibility_score": ass.temporal_compatibility_score,
            "drift_compatibility_score": ass.drift_compatibility_score,
            "trajectory_compatibility_score": ass.trajectory_compatibility_score,
            "vessel_type_score": ass.vessel_type_score,
            "ais_quality_score": ass.ais_quality_score,
            "behavior_anomaly_score": ass.behavior_anomaly_score,
            "evidence_quality_score": ass.evidence_quality_score,
            "applied_weights": ass.applied_weights,
            "forensic_summary": ass.forensic_summary,
            "supporting_evidence": supp,
            "contradicting_evidence": contra,
            "created_at": ass.created_at
        })

    top_cand = candidates_res[0] if candidates_res else None

    return {
        "investigation_id": investigation_id,
        "total_candidates_assessed": len(candidates_res),
        "top_candidate": top_cand,
        "candidates": candidates_res,
        "applied_weights": candidates_res[0]["applied_weights"] if candidates_res else {}
    }


@router.get("/assessments/{id}", response_model=CandidateAssessmentResponse)
def get_candidate_assessment(id: str, db: Session = Depends(get_db)):
    """Retrieve details of a single candidate assessment."""
    ass = db.query(CandidateAssessment).filter(CandidateAssessment.id == id).first()
    if not ass:
        raise HTTPException(status_code=404, detail=f"Assessment '{id}' not found.")

    vessel = db.query(Vessel).filter(Vessel.id == ass.vessel_id).first()
    ev_items = db.query(Evidence).filter(Evidence.candidate_assessment_id == ass.id).all()

    return {
        "id": str(ass.id),
        "investigation_id": str(ass.investigation_id),
        "vessel_id": str(ass.vessel_id),
        "vessel": vessel,
        "attribution_score": ass.attribution_score,
        "candidate_rank": ass.candidate_rank,
        "investigation_priority": ass.investigation_priority,
        "origin_compatibility_score": ass.origin_compatibility_score,
        "temporal_compatibility_score": ass.temporal_compatibility_score,
        "drift_compatibility_score": ass.drift_compatibility_score,
        "trajectory_compatibility_score": ass.trajectory_compatibility_score,
        "vessel_type_score": ass.vessel_type_score,
        "ais_quality_score": ass.ais_quality_score,
        "behavior_anomaly_score": ass.behavior_anomaly_score,
        "evidence_quality_score": ass.evidence_quality_score,
        "applied_weights": ass.applied_weights,
        "forensic_summary": ass.forensic_summary,
        "supporting_evidence": [e for e in ev_items if e.direction == "SUPPORTING"],
        "contradicting_evidence": [e for e in ev_items if e.direction == "CONTRADICTING"],
        "created_at": ass.created_at
    }
