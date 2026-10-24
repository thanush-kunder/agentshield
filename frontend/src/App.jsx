import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatCards from './components/StatCards';
import PendingQueue from './components/PendingQueue';
import AgentSimulator from './components/AgentSimulator';
import ActivityLog from './components/ActivityLog';
import ActionDetailModal from './components/ActionDetailModal';
import SafetyPoliciesModal from './components/SafetyPoliciesModal';
import { api } from './api';
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';

export default function App() {
  const [stats, setStats] = useState(null);
  const [actions, setActions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isProcessingId, setIsProcessingId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [toast, setToast] = useState(null);

  // Show temporary toast message
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4500);
  };

  // Fetch all primary dashboard telemetry
  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const [statsData, actionsData, policiesData] = await Promise.all([
        api.getStats(),
        api.getActions({ limit: 100 }),
        api.getPolicies(),
      ]);
      setStats(statsData);
      setActions(actionsData);
      setPolicies(policiesData);
      setIsConnected(true);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setIsConnected(false);
      if (!quiet) showToast('Failed to connect to backend engine. Ensure FastAPI server is running.', 'error');
    } finally {
      if (!quiet) setIsRefreshing(false);
    }
  }, []);

  // Initial load & lightweight polling
  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Simulate an agent action
  const handleSimulate = async (payload) => {
    setIsSimulating(true);
    try {
      const res = await api.simulateAction(payload);
      await loadData(true);

      if (res.decision === 'ALLOWED') {
        showToast(`Action Allowed: ${res.agent_name} permitted to execute '${res.action_type}'.`, 'success');
      } else if (res.decision === 'BLOCKED') {
        showToast(`Threat Blocked! ${res.agent_name} action halted by Zero-Trust policy.`, 'error');
      } else {
        showToast(`Review Required: Action queued in Human-in-the-Loop pending list.`, 'warning');
      }
    } catch (err) {
      showToast(`Simulation failed: ${err.message}`, 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  // Human Supervisor Approve
  const handleApprove = async (actionId, note) => {
    setIsProcessingId(actionId);
    try {
      await api.approveAction(actionId, note);
      await loadData(true);
      if (selectedAction?.id === actionId) {
        setSelectedAction(null);
      }
      showToast(`Action #${actionId} authorized and executed by supervisor.`, 'success');
    } catch (err) {
      showToast(`Approval failed: ${err.message}`, 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  // Human Supervisor Reject
  const handleReject = async (actionId, note) => {
    setIsProcessingId(actionId);
    try {
      await api.rejectAction(actionId, note);
      await loadData(true);
      if (selectedAction?.id === actionId) {
        setSelectedAction(null);
      }
      showToast(`Action #${actionId} rejected and terminated by supervisor.`, 'info');
    } catch (err) {
      showToast(`Rejection failed: ${err.message}`, 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  // Reset database with clean seed dataset
  const handleResetSeed = async () => {
    setIsRefreshing(true);
    try {
      await api.resetSeed();
      await loadData(false);
      showToast('AgentShield database reset to default demonstration state.', 'success');
    } catch (err) {
      showToast(`Reset failed: ${err.message}`, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter pending actions
  const pendingActions = actions.filter((a) => a.decision === 'PENDING_APPROVAL');

  return (
    <div className="min-h-screen bg-cyber-bg cyber-grid text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-bounce">
          <div className={`p-4 rounded-xl border shadow-2xl flex items-start space-x-3 backdrop-blur-md ${
            toast.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' 
              : toast.type === 'error' 
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200' 
              : toast.type === 'warning' 
              ? 'bg-amber-950/90 border-amber-500/50 text-amber-200' 
              : 'bg-slate-900/95 border-slate-700 text-slate-200'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />}
            <div className="text-xs font-medium leading-relaxed flex-1">
              {toast.message}
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        onRefresh={() => loadData(false)}
        onOpenPolicies={() => setShowPoliciesModal(true)}
        onResetSeed={handleResetSeed}
        isRefreshing={isRefreshing}
        isConnected={isConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metric Cards Banner */}
        <StatCards
          stats={stats}
          onFilterStatus={(status) => setFilterStatus(status)}
        />

        {/* Human-in-the-Loop Pending Queue */}
        <PendingQueue
          pendingActions={pendingActions}
          onApprove={handleApprove}
          onReject={handleReject}
          onInspect={(action) => setSelectedAction(action)}
          isProcessingId={isProcessingId}
        />

        {/* Agent Action Simulator */}
        <AgentSimulator
          onSimulate={handleSimulate}
          isSimulating={isSimulating}
        />

        {/* Complete Security Activity & Audit Log */}
        <ActivityLog
          actions={actions}
          onInspect={(action) => setSelectedAction(action)}
          filterStatus={filterStatus}
          onFilterStatus={(status) => setFilterStatus(status)}
        />
      </main>

      {/* Inspection Modal */}
      {selectedAction && (
        <ActionDetailModal
          action={selectedAction}
          onClose={() => setSelectedAction(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          isProcessing={isProcessingId === selectedAction.id}
        />
      )}

      {/* Policies Reference Modal */}
      {showPoliciesModal && (
        <SafetyPoliciesModal
          policies={policies}
          onClose={() => setShowPoliciesModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-cyber-border py-4 bg-cyber-card/60 text-center text-xs font-mono text-slate-500">
        AgentShield AI Agent Safety & Control Platform · DevHack 2026 Problem Statement PS 2.1 · Zero-Trust HITL Guardrail
      </footer>
    </div>
  );
}
