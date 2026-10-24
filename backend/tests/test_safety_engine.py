"""Test suite for AgentShield Backend Safety Engine and API Endpoints.

Covers:
- Allowing safe actions
- Blocking unauthorized / malicious actions
- Requesting approval for risky actions (Pending state)
- Approving pending actions (HITL)
- Rejecting pending actions (HITL)
- Error handling (not found, already reviewed)
- Stats verification
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.safety_engine import SafetyEngine
from app.seed_data import seed_database

# Use StaticPool so all threads and requests share the same in-memory SQLite instance
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database schema for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db, force=True)
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Override get_db with test database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# =============================================================================
# 1. Unit Tests for SafetyEngine Policy Logic
# =============================================================================

def test_safety_engine_allows_safe_temp_deletion():
    risk, decision, status, policy, reasoning = SafetyEngine.evaluate(
        agent_name="DevOps-Agent",
        action_type="DELETE_FILE",
        target_resource="/tmp/cache/build_artifact_12.tmp",
        payload={}
    )
    assert decision == "ALLOWED"
    assert status == "EXECUTED"
    assert risk < 40
    assert "SEC-POL-DEL-03" in policy


def test_safety_engine_blocks_production_database_deletion():
    risk, decision, status, policy, reasoning = SafetyEngine.evaluate(
        agent_name="DevOps-Agent",
        action_type="DELETE_FILE",
        target_resource="/var/db/prod_database.sqlite",
        payload={"force": True}
    )
    assert decision == "BLOCKED"
    assert status == "BLOCKED"
    assert risk >= 80
    assert "SEC-POL-DEL-01" in policy


def test_safety_engine_requests_approval_for_user_file_deletion():
    risk, decision, status, policy, reasoning = SafetyEngine.evaluate(
        agent_name="DocManager-Agent",
        action_type="DELETE_FILE",
        target_resource="/documents/quarterly_financial_report.pdf",
        payload={}
    )
    assert decision == "PENDING_APPROVAL"
    assert status == "PENDING"
    assert "SEC-POL-DEL-02" in policy


def test_safety_engine_allows_internal_email():
    risk, decision, status, policy, reasoning = SafetyEngine.evaluate(
        agent_name="SupportBot",
        action_type="SEND_EMAIL",
        target_resource="alerts@company.internal",
        payload={"subject": "Daily digest"}
    )
    assert decision == "ALLOWED"
    assert status == "EXECUTED"
    assert "SEC-POL-EML-03" in policy


def test_safety_engine_blocks_exfiltration_email():
    risk, decision, status, policy, reasoning = SafetyEngine.evaluate(
        agent_name="Infiltrator",
        action_type="SEND_EMAIL",
        target_resource="dropzone@exfil-hacker.com",
        payload={"subject": "leak passwords"}
    )
    assert decision == "BLOCKED"
    assert status == "BLOCKED"
    assert risk >= 80


def test_safety_engine_requests_approval_for_external_email():
    risk, decision, status, policy, reasoning = SafetyEngine.evaluate(
        agent_name="SalesBot",
        action_type="SEND_EMAIL",
        target_resource="contact@client-corp.com",
        payload={"subject": "Contract draft proposal"}
    )
    assert decision == "PENDING_APPROVAL"
    assert status == "PENDING"


def test_safety_engine_blocks_destructive_sql_query():
    risk, decision, status, policy, reasoning = SafetyEngine.evaluate(
        agent_name="DataBot",
        action_type="DATA_ACCESS",
        target_resource="users_table",
        payload={"query": "DROP TABLE users_table;--"}
    )
    assert decision == "BLOCKED"
    assert status == "BLOCKED"


def test_safety_engine_blocks_reverse_shell():
    risk, decision, status, policy, reasoning = SafetyEngine.evaluate(
        agent_name="Worker-Agent",
        action_type="SHELL_EXECUTION",
        target_resource="rm -rf / --no-preserve-root",
        payload={}
    )
    assert decision == "BLOCKED"
    assert status == "BLOCKED"


# =============================================================================
# 2. Integration Tests for API Endpoints (Simulate, Approve, Reject, Stats)
# =============================================================================

def test_api_simulate_safe_action(client):
    """Simulates a safe action through the API and checks ALLOWED decision."""
    payload = {
        "agent_name": "Test-Worker-Bot",
        "action_type": "DATA_ACCESS",
        "target_resource": "public_faq",
        "payload": {"section": "pricing"}
    }
    response = client.post("/api/actions/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "ALLOWED"
    assert data["status"] == "EXECUTED"
    assert data["risk_score"] < 40


def test_api_simulate_blocked_action(client):
    """Simulates an unauthorized action through the API and checks BLOCKED decision."""
    payload = {
        "agent_name": "Unauthorized-Agent",
        "action_type": "DELETE_FILE",
        "target_resource": "prod_database.db",
        "payload": {}
    }
    response = client.post("/api/actions/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "BLOCKED"
    assert data["status"] == "BLOCKED"
    assert data["risk_score"] >= 80


def test_api_simulate_risky_action_and_approve(client):
    """Simulates a risky action, confirms PENDING_APPROVAL, then approves it."""
    # Step 1: Simulate risky action (bulk data export)
    payload = {
        "agent_name": "Analyst-Agent",
        "action_type": "DATA_ACCESS",
        "target_resource": "customers_pii_export",
        "payload": {"records_requested": 1000}
    }
    sim_res = client.post("/api/actions/simulate", json=payload)
    assert sim_res.status_code == 200
    action = sim_res.json()
    assert action["decision"] == "PENDING_APPROVAL"
    assert action["status"] == "PENDING"
    action_id = action["id"]

    # Step 2: Human supervisor approves the action
    review_res = client.post(
        f"/api/actions/{action_id}/approve",
        json={"supervisor_note": "Approved for compliance quarterly audit."}
    )
    assert review_res.status_code == 200
    approved_action = review_res.json()
    assert approved_action["decision"] == "APPROVED"
    assert approved_action["status"] == "APPROVED"
    assert "compliance quarterly audit" in approved_action["supervisor_note"]


def test_api_simulate_risky_action_and_reject(client):
    """Simulates a risky action, confirms PENDING_APPROVAL, then rejects it."""
    # Step 1: Simulate risky action (high value transfer)
    payload = {
        "agent_name": "Payment-Agent",
        "action_type": "FINANCIAL_TRANSFER",
        "target_resource": "Vendor Account #9923",
        "payload": {"amount": 25000.0}
    }
    sim_res = client.post("/api/actions/simulate", json=payload)
    assert sim_res.status_code == 200
    action = sim_res.json()
    assert action["decision"] == "PENDING_APPROVAL"
    action_id = action["id"]

    # Step 2: Human supervisor rejects the action
    reject_res = client.post(
        f"/api/actions/{action_id}/reject",
        json={"supervisor_note": "Suspicious vendor invoice ID. Rejected."}
    )
    assert reject_res.status_code == 200
    rejected_action = reject_res.json()
    assert rejected_action["decision"] == "REJECTED"
    assert rejected_action["status"] == "REJECTED"
    assert "Suspicious vendor invoice" in rejected_action["supervisor_note"]


def test_cannot_approve_already_approved_action(client):
    """Attempting to re-approve an action that is not pending should return 400 Bad Request."""
    # Create and approve action
    sim_res = client.post("/api/actions/simulate", json={
        "agent_name": "Agent-Alpha",
        "action_type": "FINANCIAL_TRANSFER",
        "target_resource": "Supplier ABC",
        "payload": {"amount": 500}
    })
    action_id = sim_res.json()["id"]
    client.post(f"/api/actions/{action_id}/approve", json={})

    # Try approving again
    second_res = client.post(f"/api/actions/{action_id}/approve", json={})
    assert second_res.status_code == 400
    assert "cannot be approved" in second_res.json()["detail"]


def test_action_not_found(client):
    """Non-existent action returns 404."""
    response = client.get("/api/actions/999999")
    assert response.status_code == 404


def test_dashboard_stats(client):
    """Stats endpoint returns accurate aggregated counters."""
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_actions" in data
    assert "allowed_actions" in data
    assert "blocked_actions" in data
    assert "pending_actions" in data
    assert "threat_mitigation_rate" in data
    assert data["total_actions"] >= 8
