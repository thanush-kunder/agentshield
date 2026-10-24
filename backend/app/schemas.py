import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


class SimulateActionRequest(BaseModel):
    agent_name: str = Field(..., description="Name or ID of the AI Agent dispatching the action")
    action_type: str = Field(..., description="Type of action: SEND_EMAIL, DELETE_FILE, DATA_ACCESS, SHELL_EXECUTION, FINANCIAL_TRANSFER")
    target_resource: str = Field(..., description="Target file path, email address, database table, or destination")
    payload: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadata or parameters accompanying the action")


class ReviewActionRequest(BaseModel):
    supervisor_note: Optional[str] = Field(default="Reviewed and confirmed by human supervisor.", description="Supervisor explanation or audit remark")


class ActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agent_name: str
    action_type: str
    target_resource: str
    payload: Optional[str] = None
    risk_score: int
    decision: str
    status: str
    policy_rule: str
    reasoning: str
    supervisor_note: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime


class StatsResponse(BaseModel):
    total_actions: int
    allowed_actions: int
    blocked_actions: int
    pending_actions: int
    approved_actions: int
    rejected_actions: int
    threat_mitigation_rate: float
    avg_risk_score: float
    actions_by_type: Dict[str, int]
    actions_by_decision: Dict[str, int]


class PolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    action_type: str
    default_decision: str
    risk_level: str
    description: str
    is_active: bool
