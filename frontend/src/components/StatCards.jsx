import React from 'react';
import { 
  ShieldCheck, 
  ShieldX, 
  Clock, 
  Activity, 
  TrendingUp, 
  AlertTriangle 
} from 'lucide-react';

export default function StatCards({ stats, onFilterStatus }) {
  if (!stats) return null;

  const cards = [
    {
      title: 'Total Interceptions',
      value: stats.total_actions || 0,
      icon: Activity,
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      subtext: 'Evaluated actions across all agents',
      filter: null,
    },
    {
      title: 'Allowed (Safe)',
      value: stats.allowed_actions || 0,
      icon: ShieldCheck,
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      subtext: 'Within low-risk policy threshold',
      filter: 'ALLOWED',
    },
    {
      title: 'Blocked (Threats)',
      value: stats.blocked_actions || 0,
      icon: ShieldX,
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      subtext: 'Violated zero-trust safety rules',
      filter: 'BLOCKED',
    },
    {
      title: 'Pending Review',
      value: stats.pending_actions || 0,
      icon: Clock,
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      subtext: 'Awaiting human supervisor sign-off',
      badge: stats.pending_actions > 0 ? 'Requires Action' : 'All Clear',
      badgeColor: stats.pending_actions > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400',
      filter: 'PENDING',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onFilterStatus && card.filter && onFilterStatus(card.filter)}
              className={`p-5 rounded-xl bg-cyber-card border ${card.borderColor} hover:bg-cyber-cardHover transition-all cursor-pointer shadow-md relative overflow-hidden group`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className={`text-3xl font-extrabold mt-2 font-mono ${card.textColor}`}>
                    {card.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg ${card.bgColor} ${card.textColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>{card.subtext}</span>
                {card.badge && (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold font-mono ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Health & Threat Radar Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mitigation Rate */}
        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-slate-200">Threat Mitigation Efficiency</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  {stats.threat_mitigation_rate}%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Risky and malicious actions contained or quarantined before execution
              </p>
            </div>
          </div>
          <div className="hidden sm:block w-32 bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(stats.threat_mitigation_rate || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Average Risk Index */}
        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-slate-200">Mean Operational Risk Index</span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                  stats.avg_risk_score > 60 
                    ? 'bg-rose-950/60 text-rose-400 border-rose-800/40' 
                    : stats.avg_risk_score > 30 
                    ? 'bg-amber-950/60 text-amber-400 border-amber-800/40' 
                    : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                }`}>
                  {stats.avg_risk_score} / 100
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregated threat evaluation score across all simulated agent operations
              </p>
            </div>
          </div>
          <div className="hidden sm:block w-32 bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${
                stats.avg_risk_score > 60 ? 'bg-rose-500' : stats.avg_risk_score > 30 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(stats.avg_risk_score || 0, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
