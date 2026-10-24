import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from .database import Base


class ActionLog(Base):
    __tablename__ = "action_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agent_name = Column(String(100), nullable=False, index=True)
    action_type = Column(String(50), nullable=False, index=True)
    target_resource = Column(String(255), nullable=False)
    payload = Column(Text, nullable=True)
    risk_score = Column(Integer, nullable=False, default=0)
    decision = Column(String(50), nullable=False, index=True)  # ALLOWED, BLOCKED, PENDING_APPROVAL, APPROVED, REJECTED
    status = Column(String(50), nullable=False, index=True)    # EXECUTED, BLOCKED, PENDING, APPROVED, REJECTED
    policy_rule = Column(String(150), nullable=False)
    reasoning = Column(Text, nullable=False)
    supervisor_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)


class PolicyRule(Base):
    __tablename__ = "policy_rules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    action_type = Column(String(50), nullable=False)
    default_decision = Column(String(50), nullable=False)
    risk_level = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
