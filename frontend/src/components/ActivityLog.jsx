import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldX, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Trash2, 
  Mail, 
  Database, 
  Terminal, 
  DollarSign, 
  SlidersHorizontal 
} from 'lucide-react';

export default function ActivityLog({ actions, onInspect, filterStatus, onFilterStatus }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = [
    { id: 'ALL', label: 'All Interceptions' },
    { id: 'PENDING', label: 'Pending Review' },
    { id: 'ALLOWED', label: 'Allowed' },
    { id: 'BLOCKED', label: 'Blocked' },
    { id: 'APPROVED', label: 'Approved (HITL)' },
    { id: 'REJECTED', label: 'Rejected (HITL)' },
  ];

  const getActionIcon = (type) => {
    switch (type) {
      case 'DELETE_FILE': return Trash2;
      case 'SEND_EMAIL': return Mail;
      case 'DATA_ACCESS': return Database;
      case 'SHELL_EXECUTION': return Terminal;
      case 'FINANCIAL_TRANSFER': return DollarSign;
      default: return Activity;
    }
  };

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case 'ALLOWED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="h-3 w-3" />
            <span>ALLOWED</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <ShieldX className="h-3 w-3" />
            <span>BLOCKED</span>
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
            <Clock className="h-3 w-3" />
            <span>PENDING</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <CheckCircle className="h-3 w-3" />
            <span>APPROVED</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <XCircle className="h-3 w-3" />
            <span>REJECTED</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300">
            {decision}
          </span>
        );
    }
  };

  // Filter actions by tab and search query
  const filteredActions = actions.filter((action) => {
    // Tab filter
    if (filterStatus && filterStatus !== 'ALL') {
      if (filterStatus === 'PENDING') {
        if (action.decision !== 'PENDING_APPROVAL') return false;
      } else {
        if (action.decision !== filterStatus) return false;
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAgent = action.agent_name.toLowerCase().includes(q);
      const matchTarget = action.target_resource.toLowerCase().includes(q);
      const matchType = action.action_type.toLowerCase().includes(q);
      const matchPolicy = (action.policy_rule || '').toLowerCase().includes(q);
      const matchReason = (action.reasoning || '').toLowerCase().includes(q);
      return matchAgent || matchTarget || matchType || matchPolicy || matchReason;
    }

    return true;
  });

  return (
    <div className="rounded-xl bg-cyber-card border border-cyber-border overflow-hidden shadow-lg">
      {/* Header and Controls */}
      <div className="p-4 bg-gradient-to-r from-slate-900/60 via-cyber-card to-cyber-card border-b border-cyber-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Security Activity & Decision Log</span>
              <span className="text-xs font-mono text-slate-400">
                ({filteredActions.length} of {actions.length} events)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic zero-trust audit trail of evaluated agent operations
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search agent, target, rule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-900 border border-cyber-border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 bg-slate-900/40 border-b border-cyber-border flex items-center space-x-1.5 overflow-x-auto text-xs">
        <Filter className="h-3.5 w-3.5 text-slate-500 mr-1" />
        {filterTabs.map((tab) => {
          const isActive = (filterStatus === tab.id) || (!filterStatus && tab.id === 'ALL');
          return (
            <button
              key={tab.id}
              onClick={() => onFilterStatus(tab.id === 'ALL' ? null : tab.id)}
              className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                isActive 
                  ? 'bg-cyan-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-mono border-b border-cyber-border">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Agent Identifier</th>
              <th className="py-3 px-4">Action Type</th>
              <th className="py-3 px-4">Target Resource</th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4">Safety Decision</th>
              <th className="py-3 px-4 text-right">Inspection</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyber-border/70 font-sans">
            {filteredActions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                  No activity log entries match the current search or status filter.
                </td>
              </tr>
            ) : (
              filteredActions.map((action) => {
                const ActionIcon = getActionIcon(action.action_type);
                const time = new Date(action.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const date = new Date(action.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <tr 
                    key={action.id} 
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      <div>{time}</div>
                      <div className="text-[10px] text-slate-500">{date}</div>
                    </td>

                    {/* Agent Name */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-200 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                        <span className="truncate max-w-[150px]">{action.agent_name}</span>
                      </div>
                    </td>

                    {/* Action Type */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 text-slate-300 font-mono">
                        <ActionIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span>{action.action_type}</span>
                      </div>
                    </td>

                    {/* Target Resource */}
                    <td className="py-3 px-4 text-slate-300 font-mono max-w-[240px] truncate" title={action.target_resource}>
                      {action.target_resource}
                    </td>

                    {/* Risk Score */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              action.risk_score >= 80 ? 'bg-rose-500' : action.risk_score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${action.risk_score}%` }}
                          />
                        </div>
                        <span className={`font-mono text-[11px] font-semibold ${
                          action.risk_score >= 80 ? 'text-rose-400' : action.risk_score >= 40 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {action.risk_score}
                        </span>
                      </div>
                    </td>

                    {/* Safety Decision */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getDecisionBadge(action.decision)}
                    </td>

                    {/* Inspection Button */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onInspect(action)}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
