import React from 'react';
import { 
  ShieldCheck, 
  RotateCw, 
  BookOpen, 
  Zap,
  Activity
} from 'lucide-react';

export default function Navbar({ onRefresh, onOpenPolicies, onResetSeed, isRefreshing, isConnected }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyber-border bg-cyber-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                AgentShield
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
                DevHack 2026 · PS 2.1
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono hidden sm:block">
              AI Agent Safety & Zero-Trust Control Gateway
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center space-x-3">
          {/* Live Engine Status */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-md bg-cyber-card border border-cyber-border text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className={isConnected ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
              {isConnected ? "Engine Active" : "Connecting..."}
            </span>
          </div>

          {/* Policies Button */}
          <button
            onClick={onOpenPolicies}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors hover:text-white"
            title="Inspect active Zero-Trust security rules"
          >
            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Active Policies</span>
          </button>

          {/* Reset Seed Button */}
          <button
            onClick={onResetSeed}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-amber-300/90 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-800/50 rounded-lg transition-colors hover:text-amber-200"
            title="Reload realistic demo dataset"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-white bg-cyber-card hover:bg-cyber-cardHover border border-cyber-border rounded-lg transition-all disabled:opacity-50"
            title="Refresh logs & statistics"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
