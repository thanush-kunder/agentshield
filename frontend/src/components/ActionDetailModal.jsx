import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldX, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  AlertTriangle,
  Cpu,
  UserCheck
} from 'lucide-react';

export default function ActionDetailModal({ action, onClose, onApprove, onReject, isProcessing }) {
  const [note, setNote] = useState('');

  if (!action) return null;

  const isPending = action.decision === 'PENDING_APPROVAL';

  let formattedPayload = '{}';
  try {
    if (action.payload) {
      const parsed = typeof action.payload === 'string' ? JSON.parse(action.payload) : action.payload;
      formattedPayload = JSON.stringify(parsed, null, 2);
    }
  } catch {
    formattedPayload = String(action.payload || '{}');
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-2xl rounded-xl bg-cyber-card border border-cyber-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-cyber-card to-cyber-card border-b border-cyber-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  Action Audit Inspection
                </h3>
                <span className="font-mono text-xs text-slate-400">
                  #{action.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detailed telemetry and policy verification data
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-cyber-border">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Agent</span>
              <span className="font-mono font-semibold text-slate-200 mt-1 block truncate">
                {action.agent_name}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-cyber-border">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Action Type</span>
              <span className="font-mono font-semibold text-slate-200 mt-1 block">
                {action.action_type}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-cyber-border">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Risk Score</span>
              <span className={`font-mono font-bold text-sm mt-1 block ${
                action.risk_score >= 80 ? 'text-rose-400' : action.risk_score >= 40 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {action.risk_score} / 100
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-cyber-border">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] block">Decision</span>
              <span className="font-mono font-semibold text-xs mt-1 block text-slate-200">
                {action.decision}
              </span>
            </div>
          </div>

          {/* Target Resource */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Target Resource
            </label>
            <div className="p-3 rounded-lg bg-slate-900 font-mono text-xs text-cyan-300 border border-cyber-border break-all select-all">
              {action.target_resource}
            </div>
          </div>

          {/* Safety Engine Policy & Reason */}
          <div className="p-3.5 rounded-lg bg-slate-900/90 border border-cyber-border space-y-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">
                Matched Security Policy:
              </span>
              <span className="font-mono text-xs text-amber-300">
                {action.policy_rule}
              </span>
            </div>
            <p className="text-xs text-slate-300 pl-6 leading-relaxed">
              {action.reasoning}
            </p>
          </div>

          {/* Supervisor Notes (if reviewed) */}
          {action.supervisor_note && (
            <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40 space-y-1">
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold">
                <UserCheck className="h-4 w-4" />
                <span>Human Supervisor Audit Trail:</span>
              </div>
              <p className="text-xs text-slate-300 pl-6">
                "{action.supervisor_note}"
              </p>
            </div>
          )}

          {/* Action Parameters / JSON Payload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Parameters / Payload Data
              </label>
              <span className="text-[10px] text-slate-500 font-mono">application/json</span>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto max-h-48">
              {formattedPayload}
            </pre>
          </div>

          {/* Human Decision Controls (if pending) */}
          {isPending && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/40 space-y-3">
              <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold">
                <Clock className="h-4 w-4 animate-pulse" />
                <span>Pending Human Authorization Required</span>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Supervisor reasoning or audit remark..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-cyber-border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  onClick={() => onReject(action.id, note || 'Rejected by security operator.')}
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-semibold text-rose-300 bg-rose-950/70 hover:bg-rose-900 border border-rose-800 rounded-lg flex items-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject Action</span>
                </button>

                <button
                  onClick={() => onApprove(action.id, note || 'Approved by security operator.')}
                  disabled={isProcessing}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 rounded-lg flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-950 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Approve Action</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900/60 border-t border-cyber-border flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Logged: {new Date(action.created_at).toLocaleString()}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
