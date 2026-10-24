import React from 'react';
import { 
  X, 
  Shield, 
  CheckCircle, 
  ShieldAlert, 
  ShieldX, 
  Clock, 
  BookOpen 
} from 'lucide-react';

export default function SafetyPoliciesModal({ policies, onClose }) {
  if (!policies) return null;

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case 'ALLOW':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            AUTO ALLOW
          </span>
        );
      case 'BLOCK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            AUTO BLOCK
          </span>
        );
      case 'REQUIRE_APPROVAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            HUMAN SIGN-OFF
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
            {decision}
          </span>
        );
    }
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/40';
      case 'HIGH':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/40';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-950/60 border-yellow-800/40';
      default:
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-3xl rounded-xl bg-cyber-card border border-cyber-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-cyber-card to-cyber-card border-b border-cyber-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Active Safety & Zero-Trust Policies</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-xs font-mono">
                  {policies.length} Rules Enforced
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Deterministic security rules executed inside the AgentShield safety engine
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

        {/* Modal Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto divide-y divide-cyber-border">
          {policies.map((policy) => (
            <div key={policy.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {policy.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {policy.name}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getRiskBadge(policy.risk_level)}`}>
                    {policy.risk_level}
                  </span>
                  {getDecisionBadge(policy.default_decision)}
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {policy.description}
              </p>

              <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-2">
                <span>Category: {policy.action_type}</span>
                <span>•</span>
                <span className="text-emerald-400 flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Rule Operational</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/60 border-t border-cyber-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
