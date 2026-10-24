"""AgentShield Core Safety and Policy Evaluation Engine.

Evaluates simulated AI agent actions against zero-trust cybersecurity policies,
calculating risk scores and rendering deterministic decisions:
- ALLOWED: Safe action, auto-executed.
- BLOCKED: Malicious or unauthorized action, halted immediately.
- PENDING_APPROVAL: Risky action requiring Human-in-the-Loop (HITL) review.
"""

from typing import Dict, Any, Tuple
import json


DEFAULT_POLICIES = [
    {
        "code": "SEC-POL-DEL-01",
        "name": "Critical System / DB Deletion Protection",
        "action_type": "DELETE_FILE",
        "default_decision": "BLOCK",
        "risk_level": "CRITICAL",
        "description": "Blocks any agent attempt to delete system files, databases, credentials, or root directories."
    },
    {
        "code": "SEC-POL-DEL-02",
        "name": "User Data Deletion Guardrail",
        "action_type": "DELETE_FILE",
        "default_decision": "REQUIRE_APPROVAL",
        "risk_level": "HIGH",
        "description": "Requires human operator sign-off before modifying or deleting non-temporary business records."
    },
    {
        "code": "SEC-POL-DEL-03",
        "name": "Automated Cache/Temp Purge Authorization",
        "action_type": "DELETE_FILE",
        "default_decision": "ALLOW",
        "risk_level": "LOW",
        "description": "Permits safe automated cleanup of temporary scratch logs, caches, and disposable session data."
    },
    {
        "code": "SEC-POL-EML-01",
        "name": "Data Exfiltration & Threat Outbound Block",
        "action_type": "SEND_EMAIL",
        "default_decision": "BLOCK",
        "risk_level": "CRITICAL",
        "description": "Blocks emails containing suspected credentials, exfiltration targets, or malicious external endpoints."
    },
    {
        "code": "SEC-POL-EML-02",
        "name": "External Email Human-in-the-Loop Review",
        "action_type": "SEND_EMAIL",
        "default_decision": "REQUIRE_APPROVAL",
        "risk_level": "MEDIUM",
        "description": "Requires supervisor verification before agents can dispatch messages to external third-party domains."
    },
    {
        "code": "SEC-POL-EML-03",
        "name": "Internal Domain Notification Pass",
        "action_type": "SEND_EMAIL",
        "default_decision": "ALLOW",
        "risk_level": "LOW",
        "description": "Permits routine communication to verified corporate internal domain addresses (@company.internal)."
    },
    {
        "code": "SEC-POL-DAT-01",
        "name": "Privileged Credentials & Vault Shield",
        "action_type": "DATA_ACCESS",
        "default_decision": "BLOCK",
        "risk_level": "CRITICAL",
        "description": "Zero-tolerance block on queries targeting master keys, password hashes, or destructive SQL statements."
    },
    {
        "code": "SEC-POL-DAT-02",
        "name": "PII Export & Bulk Retrieval Review",
        "action_type": "DATA_ACCESS",
        "default_decision": "REQUIRE_APPROVAL",
        "risk_level": "HIGH",
        "description": "Requires human approval before exporting sensitive PII customer databases or financial records."
    },
    {
        "code": "SEC-POL-DAT-03",
        "name": "Public Knowledgebase & Telemetry Pass",
        "action_type": "DATA_ACCESS",
        "default_decision": "ALLOW",
        "risk_level": "LOW",
        "description": "Allows unrestricted agent read access to public FAQs, product documentation, and system health status."
    },
    {
        "code": "SEC-POL-SHL-01",
        "name": "Arbitrary Shell Injection & Command Block",
        "action_type": "SHELL_EXECUTION",
        "default_decision": "BLOCK",
        "risk_level": "CRITICAL",
        "description": "Prohibits dangerous shell execution commands (rm -rf, reverse shells, privilege escalations, curl exfil)."
    },
    {
        "code": "SEC-POL-SHL-02",
        "name": "Deployment & Service Mutation Approval",
        "action_type": "SHELL_EXECUTION",
        "default_decision": "REQUIRE_APPROVAL",
        "risk_level": "HIGH",
        "description": "Mandates human confirmation before deploying containers, restarting services, or executing git push force."
    },
    {
        "code": "SEC-POL-FIN-01",
        "name": "Critical Financial Ceiling Defense",
        "action_type": "FINANCIAL_TRANSFER",
        "default_decision": "BLOCK",
        "risk_level": "CRITICAL",
        "description": "Prevents unauthorized transactions exceeding the hard ceiling ($50,000) or directed to unverified destinations."
    },
    {
        "code": "SEC-POL-FIN-02",
        "name": "Secondary Sign-off for Financial Outflows",
        "action_type": "FINANCIAL_TRANSFER",
        "default_decision": "REQUIRE_APPROVAL",
        "risk_level": "HIGH",
        "description": "Enforces human supervisor approval on all financial disbursements between $100 and $50,000."
    }
]


class SafetyEngine:
    """Evaluates agent actions against security policies and determines safety status."""

    @staticmethod
    def evaluate(agent_name: str, action_type: str, target_resource: str, payload: Dict[str, Any]) -> Tuple[int, str, str, str, str]:
        """
        Evaluates the requested action.

        Returns:
            Tuple of:
            - risk_score (0-100)
            - decision (ALLOWED, BLOCKED, PENDING_APPROVAL)
            - status (EXECUTED, BLOCKED, PENDING)
            - policy_rule (Code & Name)
            - reasoning (Detailed justification)
        """
        action_type = (action_type or "").upper().strip()
        target = (target_resource or "").lower().strip()
        agent = (agent_name or "").strip()
        payload_str = json.dumps(payload).lower() if isinstance(payload, dict) else str(payload).lower()

        # Check for rogue or unauthorized agent identifiers
        if "unauthorized" in agent.lower() or "rogue" in agent.lower() or "malicious" in agent.lower():
            return (
                98,
                "BLOCKED",
                "BLOCKED",
                "SEC-POL-AGT-01 (Untrusted Agent Quarantine)",
                f"Agent '{agent}' is not registered on the verified Agent Trust Registry. Action blocked by Zero Trust gatekeeper."
            )

        # -------------------------------------------------------------------------
        # 1. DELETE_FILE
        # -------------------------------------------------------------------------
        if action_type == "DELETE_FILE":
            critical_keywords = [
                "system32", "etc", "/bin", "prod_db", "database.sqlite", "agentshield.db",
                ".env", "id_rsa", "shadow", "root", "boot", "production", "backup_master",
                "kernel", "passwd"
            ]
            if any(k in target for k in critical_keywords) or any(k in payload_str for k in ["*", "rm -rf", "force"]):
                return (
                    96,
                    "BLOCKED",
                    "BLOCKED",
                    "SEC-POL-DEL-01 (Critical System / DB Deletion Protection)",
                    f"Blocked destructive deletion attempt targeting critical resource '{target_resource}'. Violates system integrity policy."
                )

            safe_keywords = ["tmp", "temp", "cache", ".log", "scratch", "trash", "disposable"]
            if any(k in target for k in safe_keywords):
                return (
                    12,
                    "ALLOWED",
                    "EXECUTED",
                    "SEC-POL-DEL-03 (Automated Cache/Temp Purge Authorization)",
                    f"Authorized routine deletion of temporary/cache asset '{target_resource}' by agent '{agent}'."
                )

            # Non-temporary file requires human approval
            return (
                65,
                "PENDING_APPROVAL",
                "PENDING",
                "SEC-POL-DEL-02 (User Data Deletion Guardrail)",
                f"Deletion of non-temporary file '{target_resource}' detected. Requires human operator verification before execution."
            )

        # -------------------------------------------------------------------------
        # 2. SEND_EMAIL
        # -------------------------------------------------------------------------
        elif action_type == "SEND_EMAIL":
            exfil_keywords = [
                "exfil", "pastebin", "leak", "tempmail", "hacker", "attacker",
                "tor2web", "credit_cards", "passwords", "private_key"
            ]
            if any(k in target for k in exfil_keywords) or any(k in payload_str for k in exfil_keywords):
                return (
                    92,
                    "BLOCKED",
                    "BLOCKED",
                    "SEC-POL-EML-01 (Data Exfiltration & Threat Outbound Block)",
                    f"Target recipient '{target_resource}' or email payload contains blacklisted exfiltration signatures. Transmission terminated."
                )

            # Check internal domain
            internal_domains = ["@company.internal", "@enterprise.local", "@agentshield.corp", "@internal.net"]
            is_internal = any(target.endswith(dom) or f"@{dom}" in target for dom in internal_domains)
            
            # Count recipients if provided in payload
            recipients = payload.get("recipients", []) if isinstance(payload, dict) else []
            recipient_count = len(recipients) if isinstance(recipients, list) else 1

            if is_internal and recipient_count <= 5 and not payload.get("sensitive", False):
                return (
                    15,
                    "ALLOWED",
                    "EXECUTED",
                    "SEC-POL-EML-03 (Internal Domain Notification Pass)",
                    f"Outbound email to internal destination '{target_resource}' verified. Auto-dispatched safely."
                )

            # External or bulk email requires approval
            return (
                58,
                "PENDING_APPROVAL",
                "PENDING",
                "SEC-POL-EML-02 (External Email Human-in-the-Loop Review)",
                f"Outbound email targeted to external domain '{target_resource}' (Recipients: {recipient_count}). Human authorization required to prevent data leakage."
            )

        # -------------------------------------------------------------------------
        # 3. DATA_ACCESS
        # -------------------------------------------------------------------------
        elif action_type == "DATA_ACCESS":
            restricted_vaults = [
                "passwords", "api_keys", "jwt_secret", "ssn_records", "credit_card",
                "salaries_exec", "shadow", "master_keys", "vault"
            ]
            destructive_sql = ["drop table", "truncate", "alter user", "grant all", "union select", "delete from"]

            if any(k in target for k in restricted_vaults) or any(k in payload_str for k in destructive_sql):
                return (
                    97,
                    "BLOCKED",
                    "BLOCKED",
                    "SEC-POL-DAT-01 (Privileged Credentials & Vault Shield)",
                    f"Unauthorized access request targeting high-confidentiality resource '{target_resource}'. Access denied by Zero Trust security policy."
                )

            safe_data = ["public_faq", "system_metrics", "helpdesk_articles", "product_catalog", "health_check", "status", "readme"]
            if any(k in target for k in safe_data):
                return (
                    8,
                    "ALLOWED",
                    "EXECUTED",
                    "SEC-POL-DAT-03 (Public Knowledgebase & Telemetry Pass)",
                    f"Read-only access granted for unclassified resource '{target_resource}'."
                )

            # PII or general user database requires approval
            return (
                72,
                "PENDING_APPROVAL",
                "PENDING",
                "SEC-POL-DAT-02 (PII Export & Bulk Retrieval Review)",
                f"Query on sensitive business data repository '{target_resource}'. Requires supervisor sign-off to ensure data compliance (GDPR/HIPAA)."
            )

        # -------------------------------------------------------------------------
        # 4. SHELL_EXECUTION
        # -------------------------------------------------------------------------
        elif action_type == "SHELL_EXECUTION":
            lethal_commands = [
                "rm -rf", "curl", "wget", "bash -i", "nc ", "ncat", "chmod 777",
                "mkfs", "powershell -enc", "invoke-webrequest", "eval(", "shadow"
            ]
            cmd = target or payload_str
            if any(k in cmd for k in lethal_commands):
                return (
                    100,
                    "BLOCKED",
                    "BLOCKED",
                    "SEC-POL-SHL-01 (Arbitrary Shell Injection & Command Block)",
                    f"Blocked hazardous command execution pattern in '{target_resource}'. Arbitrary shell and reverse proxy execution forbidden."
                )

            safe_diagnostics = ["git status", "uptime", "node -v", "python --version", "pytest", "npm run lint"]
            if any(target.startswith(k) for k in safe_diagnostics):
                return (
                    14,
                    "ALLOWED",
                    "EXECUTED",
                    "SEC-POL-SHL-03 (Diagnostic Read-Only Shell Pass)",
                    f"Benign diagnostic tool execution '{target_resource}' permitted in sandbox environment."
                )

            return (
                76,
                "PENDING_APPROVAL",
                "PENDING",
                "SEC-POL-SHL-02 (Deployment & Service Mutation Approval)",
                f"Infrastructure state modification command '{target_resource}'. Operator manual authorization required."
            )

        # -------------------------------------------------------------------------
        # 5. FINANCIAL_TRANSFER
        # -------------------------------------------------------------------------
        elif action_type == "FINANCIAL_TRANSFER":
            amount = 0.0
            if isinstance(payload, dict) and "amount" in payload:
                try:
                    amount = float(payload.get("amount", 0))
                except (ValueError, TypeError):
                    amount = 500.0

            if amount > 50000 or "offshore" in target or "crypto" in target or "unverified" in target:
                return (
                    95,
                    "BLOCKED",
                    "BLOCKED",
                    "SEC-POL-FIN-01 (Critical Financial Ceiling Defense)",
                    f"Financial disbursement of ${amount:,.2f} to '{target_resource}' exceeds safety threshold ($50,000) or involves unverified accounts."
                )

            if amount <= 100 and "reimbursement" in target or "micro" in target:
                return (
                    5,
                    "ALLOWED",
                    "EXECUTED",
                    "SEC-POL-FIN-03 (Automated Micro-Expense Allowance)",
                    f"Micro-transaction of ${amount:,.2f} to '{target_resource}' authorized under automated petty expense allowance."
                )

            return (
                68,
                "PENDING_APPROVAL",
                "PENDING",
                "SEC-POL-FIN-02 (Secondary Sign-off for Financial Outflows)",
                f"Financial transfer of ${amount:,.2f} to '{target_resource}' requires human supervisor dual-authorization."
            )

        # -------------------------------------------------------------------------
        # Fallback / Default Policy
        # -------------------------------------------------------------------------
        return (
            50,
            "PENDING_APPROVAL",
            "PENDING",
            "SEC-POL-GEN-01 (Default Zero-Trust Human Verification)",
            f"Uncategorized action '{action_type}' on '{target_resource}'. Held for security supervisor inspection under zero-trust default."
        )
