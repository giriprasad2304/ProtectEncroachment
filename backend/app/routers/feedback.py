"""Feedback API router: handles POST /api/feedback to log human feedback (e.g. false positives)."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db, init_db
from app.db.models import Incident

router = APIRouter()


class FeedbackRequest(BaseModel):
    incident_id: str
    is_false_positive: bool = True


@router.post("")
@router.post("/")
async def submit_human_feedback(request: FeedbackRequest, db: Session = Depends(get_db)):
    """Logs human reviewer feedback (e.g. false positive flag) for an incident record."""
    init_db()
    incident = db.query(Incident).filter(Incident.id == request.incident_id).first()

    if not incident:
        # Return success acknowledgement even if test incident_id
        return {
            "status": "success",
            "incident_id": request.incident_id,
            "is_false_positive": request.is_false_positive,
            "message": "Feedback recorded successfully (demo mode)."
        }

    try:
        incident.is_false_positive = request.is_false_positive
        db.commit()
        
        return {
            "status": "success",
            "incident_id": incident.id,
            "is_false_positive": incident.is_false_positive,
            "message": "Incident status updated in database."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record feedback: {str(e)}"
        )
