import json
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .database import engine, Base, get_db
from .models import ActionLog, PolicyRule
from .schemas import (
    SimulateActionRequest,
    ReviewActionRequest,
    ActionResponse,
    StatsResponse,
    PolicyResponse
)
from .safety_engine import SafetyEngine
from .seed_data import seed_database

# Create DB tables
Base.metadata.create_all(bind=engine)

# Auto-seed sample policies and actions on startup if empty
with next(get_db()) as startup_db:
    seed_database(startup_db, force=False)

app = FastAPI(
    title="AgentShield API",
    description="Zero-Trust AI Agent Safety, Guardrail and Human-in-the-Loop Control Platform",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server and general local clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["System"])
def health_check():
    """Health check endpoint to verify backend operational readiness."""
    return {
        "status": "healthy",
        "service": "AgentShield Safety Engine",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }


@app.get("/api/stats", response_model=StatsResponse, tags=["Dashboard"])
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Computes real-time statistics for intercepted agent actions and threat mitigation."""
    actions = db.query(ActionLog).all()
    total = len(actions)

    allowed = sum(1 for a in actions if a.decision == "ALLOWED")
    blocked = sum(1 for a in actions if a.decision == "BLOCKED")
    pending = sum(1 for a in actions if a.decision == "PENDING_APPROVAL")
    approved = sum(1 for a in actions if a.decision == "APPROVED")
    rejected = sum(1 for a in actions if a.decision == "REJECTED")

    # Threat mitigation rate: percentage of risky/unauthorized actions successfully blocked or held
    prevented_or_held = blocked + rejected + pending
    mitigation_rate = (prevented_or_held / total * 100.0) if total > 0 else 100.0

    avg_risk = (sum(a.risk_score for a in actions) / total) if total > 0 else 0.0

    actions_by_type = {}
    actions_by_decision = {}
    for a in actions:
        actions_by_type[a.action_type] = actions_by_type.get(a.action_type, 0) + 1
        actions_by_decision[a.decision] = actions_by_decision.get(a.decision, 0) + 1

    return StatsResponse(
        total_actions=total,
        allowed_actions=allowed,
        blocked_actions=blocked,
        pending_actions=pending,
        approved_actions=approved,
        rejected_actions=rejected,
        threat_mitigation_rate=round(mitigation_rate, 1),
        avg_risk_score=round(avg_risk, 1),
        actions_by_type=actions_by_type,
        actions_by_decision=actions_by_decision
    )


@app.get("/api/actions", response_model=List[ActionResponse], tags=["Actions"])
def list_actions(
    status: Optional[str] = Query(None, description="Filter by decision: ALLOWED, BLOCKED, PENDING_APPROVAL, APPROVED, REJECTED"),
    agent: Optional[str] = Query(None, description="Filter by agent name"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieves all agent action logs sorted by timestamp descending, with optional filters."""
    query = db.query(ActionLog)

    if status:
        status_val = status.upper().strip()
        if status_val == "PENDING":
            query = query.filter(ActionLog.decision == "PENDING_APPROVAL")
        else:
            query = query.filter(ActionLog.decision == status_val)

    if agent:
        query = query.filter(ActionLog.agent_name.ilike(f"%{agent.strip()}%"))

    actions = query.order_by(desc(ActionLog.created_at)).limit(limit).all()
    return actions


@app.get("/api/actions/{action_id}", response_model=ActionResponse, tags=["Actions"])
def get_action_detail(action_id: int, db: Session = Depends(get_db)):
    """Retrieves detailed record for a specific intercepted action."""
    action = db.query(ActionLog).filter(ActionLog.id == action_id).first()
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action with ID {action_id} not found."
        )
    return action


@app.post("/api/actions/simulate", response_model=ActionResponse, tags=["Actions"])
def simulate_agent_action(
    req: SimulateActionRequest,
    db: Session = Depends(get_db)
):
    """
    Simulates an AI Agent action, evaluates it against the safety policy engine,
    determines the decision (ALLOWED, BLOCKED, or PENDING_APPROVAL), and stores the result.
    """
    payload_data = req.payload if req.payload is not None else {}
    payload_str = json.dumps(payload_data)

    risk_score, decision, action_status, policy_rule, reasoning = SafetyEngine.evaluate(
        agent_name=req.agent_name,
        action_type=req.action_type,
        target_resource=req.target_resource,
        payload=payload_data
    )

    new_action = ActionLog(
        agent_name=req.agent_name,
        action_type=req.action_type.upper(),
        target_resource=req.target_resource,
        payload=payload_str,
        risk_score=risk_score,
        decision=decision,
        status=action_status,
        policy_rule=policy_rule,
        reasoning=reasoning,
        supervisor_note=None,
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )

    db.add(new_action)
    db.commit()
    db.refresh(new_action)

    return new_action


@app.post("/api/actions/{action_id}/approve", response_model=ActionResponse, tags=["Human-in-the-Loop"])
def approve_pending_action(
    action_id: int,
    req: ReviewActionRequest = ReviewActionRequest(),
    db: Session = Depends(get_db)
):
    """
    Human supervisor manual sign-off for a pending action.
    Transitions decision to 'APPROVED' and status to 'APPROVED' / 'EXECUTED'.
    """
    action = db.query(ActionLog).filter(ActionLog.id == action_id).first()
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action with ID {action_id} not found."
        )

    if action.decision != "PENDING_APPROVAL":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Action {action_id} is already in state '{action.decision}' and cannot be approved."
        )

    action.decision = "APPROVED"
    action.status = "APPROVED"
    action.supervisor_note = req.supervisor_note or "Action approved by human security supervisor."
    action.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(action)
    return action


@app.post("/api/actions/{action_id}/reject", response_model=ActionResponse, tags=["Human-in-the-Loop"])
def reject_pending_action(
    action_id: int,
    req: ReviewActionRequest = ReviewActionRequest(),
    db: Session = Depends(get_db)
):
    """
    Human supervisor manual rejection of a pending action.
    Transitions decision to 'REJECTED' and status to 'REJECTED'.
    """
    action = db.query(ActionLog).filter(ActionLog.id == action_id).first()
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action with ID {action_id} not found."
        )

    if action.decision != "PENDING_APPROVAL":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Action {action_id} is already in state '{action.decision}' and cannot be rejected."
        )

    action.decision = "REJECTED"
    action.status = "REJECTED"
    action.supervisor_note = req.supervisor_note or "Action denied by human security supervisor."
    action.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(action)
    return action


@app.get("/api/policies", response_model=List[PolicyResponse], tags=["Policies"])
def list_policies(db: Session = Depends(get_db)):
    """Lists all configured zero-trust security policies and thresholds."""
    return db.query(PolicyRule).all()


@app.post("/api/actions/reset-seed", tags=["System"])
def reset_database_seed(db: Session = Depends(get_db)):
    """Resets the SQLite database and populates it with fresh standard demonstration data."""
    seed_database(db, force=True)
    return {
        "status": "success",
        "message": "AgentShield database refreshed with clean demonstration seed data."
    }
