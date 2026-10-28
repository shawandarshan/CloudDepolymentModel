import React, { useState } from 'react';
import {
  Bell, CheckCircle2, AlertTriangle, ShieldAlert, Database,
  RefreshCw, Server, Cloud, ChevronRight, X, ExternalLink
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { PageId, DeploymentModelId } from '../../types';

interface HeaderProps {
  onOpenReset: () => void;
}

const PAGE_NAMES: Record<PageId, string> = {
  overview: 'Overview Dashboard',
  comparison: 'Cloud Model Comparison',
  'dr-lab': 'Disaster Recovery Lab',
  'cost-explorer': 'Cost Explorer & Forecast',
  scalability: 'Scalability Simulator',
  architecture: 'Architecture Designer',
  recommendations: 'Risk & Recommendation Center',
  reports: 'Reports & Export',
  settings: 'Settings & Simulation Data'
};

export const Header: React.FC<HeaderProps> = ({ onOpenReset }) => {
  const {
    currentPage, setCurrentPage, selectedModel, setSelectedModel,
    userConfig, isBackendOnline, activeIncident, alerts, markAlertsRead
  } = useSimulation();

  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      {/* Top Banner if Active Incident in Progress */}
      {activeIncident && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-800 animate-pulse">
          <div className="flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>SIMULATION ACTIVE:</strong> {activeIncident.title} ({activeIncident.deployment_model.toUpperCase()} CLOUD) —
              Downtime: {activeIncident.simulated_rto_minutes}m
              {activeIncident.rto_breached && ' (⚠️ TARGET RTO BREACHED)'}
            </span>
          </div>
          <button
            onClick={() => setCurrentPage('dr-lab')}
            className="flex items-center gap-1 font-semibold underline text-rose-700 hover:text-rose-900 ml-4 flex-shrink-0"
          >
            Open DR Lab <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Breadcrumbs & Page Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center text-xs text-slate-400 font-medium">
            <span>StreamCloud</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1" />
            <span className="text-slate-700 font-semibold">{PAGE_NAMES[currentPage]}</span>
          </div>
        </div>

        {/* Right: Quick Controls, Model Switcher, Status Pill & Notifications */}
        <div className="flex items-center gap-3">
          {/* Quick Model Selector Pills */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            {(['public', 'private', 'hybrid'] as DeploymentModelId[]).map(m => (
              <button
                key={m}
                onClick={() => setSelectedModel(m)}
                className={`px-3 py-1.5 rounded-md transition-all capitalize flex items-center gap-1.5 ${
                  selectedModel === m
                    ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m === 'hybrid' ? '⚡ Hybrid' : (m === 'public' ? '🌐 Public' : '🏢 Private')}
              </button>
            ))}
          </div>

          {/* Backend Connection Indicator */}
          <div
            title={isBackendOnline ? "Connected to Python FastAPI & SQLite backend" : "Operating in browser standalone mode (LocalStorage)"}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
              isBackendOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isBackendOnline ? 'API: Connected' : 'Client Mode'}</span>
          </div>

          {/* Currency indicator */}
          <div className="hidden lg:flex items-center px-2 py-1 bg-slate-100 text-slate-600 text-xs font-mono rounded border border-slate-200">
            <span>Currency: {userConfig.currency} ({userConfig.currency_symbol})</span>
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={onOpenReset}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
            title="Reset simulation parameters to default"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && unreadCount > 0) {
                  markAlertsRead();
                }
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Simulation Alerts & Events"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-700">Simulated Alerts & Logs</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {alerts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No active alerts</div>
                  ) : (
                    alerts.map(a => (
                      <div key={a.id} className="p-3 text-xs hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`font-semibold ${
                            a.severity === 'err' ? 'text-rose-600' : (a.severity === 'warn' ? 'text-amber-600' : 'text-slate-800')
                          }`}>
                            {a.title}
                          </span>
                          <span className="text-[10px] text-slate-400">{a.timestamp}</span>
                        </div>
                        <p className="text-slate-500 mt-1 leading-snug">{a.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
