import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  ShieldAlert,
  ArrowRight,
  Eye
} from 'lucide-react';

export default function PendingQueue({ pendingActions, onApprove, onReject, onInspect, isProcessingId }) {
  const [supervisorNotes, setSupervisorNotes] = useState({});

  const handleNoteChange = (id, text) => {
    setSupervisorNotes(prev => ({ ...prev, [id]: text }));
  };

  const handleApprove = (id) => {
    const note = supervisorNotes[id] || 'Approved by security supervisor.';
    onApprove(id, note);
  };

  const handleReject = (id) => {
    const note = supervisorNotes[id] || 'Rejected by security supervisor.';
    onReject(id, note);
  };

  return (
    <div className="rounded-xl bg-cyber-card border border-amber-500/30 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-amber-950/40 via-cyber-card to-cyber-card border-b border-cyber-border flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Human-in-the-Loop Approval Queue</span>
              <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {pendingActions.length} Pending
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Actions flagged by Safety Engine requiring human operator verification
            </p>
          </div>
        </div>
      </div>

      {/* Queue Body */}
      <div className="divide-y divide-cyber-border">
        {pendingActions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Zero-Trust Queue Clear</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No actions currently waiting for supervisor review. Simulate a risky action below to test the Human-in-the-Loop workflow.
            </p>
          </div>
        ) : (
          pendingActions.map((action) => {
            const isProcessing = isProcessingId === action.id;
            return (
              <div key={action.id} className="p-4 sm:p-5 hover:bg-slate-900/40 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Action Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                        {action.agent_name}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {action.action_type}
                      </span>
                      <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40 text-xs font-mono">
                        <ShieldAlert className="h-3 w-3" />
                        <span>Risk: {action.risk_score}/100</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(action.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Target Resource */}
                    <div className="flex items-center space-x-2 font-mono text-xs">
                      <span className="text-slate-500">Target:</span>
                      <span className="text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded break-all border border-slate-700/60">
                        {action.target_resource}
                      </span>
                    </div>

                    {/* Reasoning */}
                    <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/30 text-xs text-amber-200/90 flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-semibold text-amber-300 font-mono mr-1">
                          [{action.policy_rule.split('(')[0].trim()}]:
                        </span>
                        {action.reasoning}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Supervisor Note & Decision Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-end lg:items-end gap-2.5 shrink-0">
                    {/* Supervisor Note Input */}
                    <input
                      type="text"
                      placeholder="Optional supervisor remark..."
                      value={supervisorNotes[action.id] || ''}
                      onChange={(e) => handleNoteChange(action.id, e.target.value)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-xs bg-slate-900/90 border border-cyber-border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full sm:w-64"
                    />

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onInspect(action)}
                        className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center space-x-1 transition-colors"
                        title="Inspect full payload"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
                      </button>

                      {/* Reject Button */}
                      <button
                        onClick={() => handleReject(action.id)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/80 rounded-lg flex items-center space-x-1.5 transition-all shadow-sm hover:shadow-rose-950/50 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4 text-rose-400" />
                        <span>{isProcessing ? 'Processing...' : 'Reject'}</span>
                      </button>

                      {/* Approve Button */}
                      <button
                        onClick={() => handleApprove(action.id)}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30 rounded-lg flex items-center space-x-1.5 transition-all shadow-sm hover:shadow-emerald-900/50 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4 text-white" />
                        <span>{isProcessing ? 'Processing...' : 'Approve'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
