import React, { useState } from 'react';
import {
  ShieldAlert, ShieldCheck, Database, HardDrive, Server, Globe,
  AlertTriangle, RefreshCw, Play, ArrowRight, CheckCircle2, XCircle,
  Clock, Activity, Info, Zap, Layers, FileDown
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { ComponentNodeState, EventStep, SimulationResultOutput } from '../types';

export const DisasterRecoveryLab: React.FC = () => {
  const {
    selectedModel, setSelectedModel, userConfig, activeUsers,
    activeIncident, isSimulating, simulationProgress,
    triggerScenario, resolveCurrentIncident
  } = useSimulation();

  const [scenarioType, setScenarioType] = useState<string>('database_failure');
  const [recoveryConfig, setRecoveryConfig] = useState<string>('standby_failover');
  const [customRtoTarget, setCustomRtoTarget] = useState<number>(userConfig.rto_target_minutes || 15);
  const [customRpoTarget, setCustomRpoTarget] = useState<number>(userConfig.rpo_target_minutes || 15);
  const [customBackupFreq, setCustomBackupFreq] = useState<number>(userConfig.backup_frequency_hours || 4);
  const [customRepLag, setCustomRepLag] = useState<number>(userConfig.replication_lag_seconds || 15);

  const [activeTab, setActiveTab] = useState<'topology' | 'timeline' | 'academic'>('topology');

  // Default baseline nodes if no incident has run yet
  const defaultNodes: ComponentNodeState[] = [
    { id: "cdn", name: "Edge CDN & Anycast", category: "network", domain: "edge", status: "Healthy", latency_ms: 18.0, capacity_pct: 42.0, role: "Traffic Distribution" },
    { id: "app_servers", name: "Streaming App Cluster", category: "compute", domain: selectedModel, status: "Healthy", latency_ms: 35.0, capacity_pct: 55.0, role: "Transcoding & API" },
    { id: "primary_db", name: "Primary Database", category: "database", domain: selectedModel === 'public' ? 'public' : 'private', status: "Healthy", latency_ms: 4.0, capacity_pct: 65.0, role: "Catalog & Metadata" },
    { id: "secondary_db", name: "Cloud Standby DB (DR)", category: "database", domain: selectedModel === 'hybrid' ? 'public' : selectedModel, status: recoveryConfig === 'no_standby' ? 'Failed' : 'Standby', latency_ms: 12.0, capacity_pct: 30.0, role: "Asynchronous Standby" },
    { id: "media_storage", name: "Media Video Storage", category: "storage", domain: selectedModel === 'private' ? 'private' : 'public', status: "Healthy", latency_ms: 25.0, capacity_pct: 68.0, role: "S3 / SAN Storage" },
    { id: "backup_repo", name: "Cold Snapshot Vault", category: "backup", domain: "public", status: "Healthy", latency_ms: 50.0, capacity_pct: 45.0, role: `Snapshots (${customBackupFreq}h)` },
    { id: "cloud_dr_burst", name: "Cloud Pilot Light DR", category: "compute", domain: "public", status: selectedModel !== 'private' ? 'Healthy' : 'Standby', latency_ms: 22.0, capacity_pct: 15.0, role: "Auto-Failover Orchestrator" }
  ];

  const currentNodes = activeIncident?.nodes_state || defaultNodes;

  const handleRunSimulation = () => {
    triggerScenario(scenarioType, recoveryConfig);
  };

  const getNodeBadgeClass = (status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Degraded': return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'Failed': return 'bg-rose-50 text-rose-700 border-rose-300 animate-bounce';
      case 'Recovering': return 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse';
      case 'Standby': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Interactive Failure & Recovery Laboratory</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Disaster Recovery & High Availability Simulator</h1>
          <p className="text-xs text-slate-500 mt-1">
            Test how database outages, storage failures, and network cuts cascade through the streaming architecture.
          </p>
        </div>

        {/* Model Selector in Lab */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Evaluation Model:</span>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {(['public', 'private', 'hybrid'] as const).map(m => (
              <button
                key={m}
                onClick={() => setSelectedModel(m)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                  selectedModel === m ? 'bg-white text-indigo-700 shadow-sm font-semibold' : 'text-slate-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Control Deck & Scenario Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration & Scenario Selection (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Scenario Control Deck
            </h2>
            <span className="text-xs font-mono text-slate-400">Step 1: Configure & Trigger</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scenario Type */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Failure Scenario</label>
              <select
                value={scenarioType}
                onChange={e => setScenarioType(e.target.value)}
                className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="database_failure">Database Failure (Case Study Outage)</option>
                <option value="storage_failure">Media Storage / SAN Volume Failure</option>
                <option value="network_outage">Core Transit ISP & BGP Gateway Cut</option>
                <option value="traffic_spike">10x Viral Streaming Traffic Surge</option>
              </select>
            </div>

            {/* Recovery Configuration */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Recovery Architecture Configuration</label>
              <select
                value={recoveryConfig}
                onChange={e => setRecoveryConfig(e.target.value)}
                className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="standby_failover">Standby Replica with Auto-Failover (Multi-AZ / Cloud DR)</option>
                <option value="backup_restore">Backup Restoration without Live Standby (Snapshot Restore)</option>
                <option value="no_standby">No Standby Replica (Original Case Study Fragility)</option>
              </select>
            </div>
          </div>

          {/* Interactive Parameters Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Target RTO (Recovery Time Objective):</span>
                <span className="font-mono font-bold text-indigo-600">{customRtoTarget} minutes</span>
              </div>
              <input
                type="range"
                min="2"
                max="60"
                step="1"
                value={customRtoTarget}
                onChange={e => setCustomRtoTarget(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Target RPO (Recovery Point Objective):</span>
                <span className="font-mono font-bold text-indigo-600">{customRpoTarget} minutes</span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={customRpoTarget}
                onChange={e => setCustomRpoTarget(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Simulate Failure & Trigger Recovery</span>
            </button>

            {activeIncident && (
              <button
                onClick={resolveCurrentIncident}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
              >
                Reset Topology
              </button>
            )}

            <span className="text-xs text-slate-400 ml-auto hidden sm:inline">
              Deterministic mathematical engine based on selected cloud configuration
            </span>
          </div>

          {/* Real-time simulation progress bar */}
          {isSimulating && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Executing automated disaster recovery workflow...</span>
                <span>{simulationProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${simulationProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Simulation Telemetry & Impact Scorecard (1 Col) */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-3">
              <span>Incident Telemetry</span>
              <span className="font-mono text-indigo-400">{activeIncident?.incident_code || 'STANDBY'}</span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Service Status</span>
                <div className="text-lg font-bold flex items-center gap-2">
                  {activeIncident ? (
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
                      Degraded / Recovered
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      All Nodes Operational
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400">Achieved RTO</span>
                  <div className={`text-base font-bold font-mono ${
                    activeIncident?.rto_breached ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {activeIncident ? `${activeIncident.simulated_rto_minutes} min` : '—'}
                  </div>
                  <span className="text-[10px] text-slate-500">Target: {customRtoTarget}m</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400">Achieved RPO</span>
                  <div className={`text-base font-bold font-mono ${
                    activeIncident?.rpo_breached ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {activeIncident ? `${activeIncident.simulated_rpo_minutes} min` : '—'}
                  </div>
                  <span className="text-[10px] text-slate-500">Target: {customRpoTarget}m</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">Potential Data Loss</span>
                <div className="text-xs font-mono font-medium text-slate-200 mt-0.5">
                  {activeIncident ? activeIncident.data_loss_estimate : 'None (Synchronous state)'}
                </div>
              </div>
            </div>
          </div>

          {activeIncident?.rto_breached && (
            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              <strong>SLA BREACH ALERT:</strong> Actual downtime exceeded the configured {customRtoTarget}m RTO target!
            </div>
          )}
        </div>
      </div>

      {/* Main Lab Canvas: Tabs for Topology Graph vs Event Timeline vs Academic Concept */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('topology')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'topology' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Live Infrastructure Topology Canvas
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'timeline' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Step-by-Step Incident Timeline ({activeIncident?.recovery_steps.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('academic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'academic' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              Replica vs Backup Distinction
            </button>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Component Health State Engine</span>
        </div>

        {/* Tab 1: Topology Graph Canvas */}
        {activeTab === 'topology' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentNodes.map(node => (
                <div
                  key={node.id}
                  className={`p-4 rounded-xl border transition-all ${
                    node.status === 'Failed'
                      ? 'border-rose-400 bg-rose-50/40 shadow-sm'
                      : (node.status === 'Degraded'
                        ? 'border-amber-300 bg-amber-50/40 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm')
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {node.domain} domain
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getNodeBadgeClass(node.status)}`}>
                      {node.status}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 text-sm mb-1">{node.name}</div>
                  <div className="text-xs text-slate-500 mb-3">{node.role}</div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
                    <span>Latency: {node.latency_ms > 1000 ? 'TIMEOUT' : `${node.latency_ms}ms`}</span>
                    <span>Load: {node.capacity_pct}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Topology Flow Diagram Legend */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">Connection Architecture:</span>
                <span>Edge CDN → App Cluster → Primary DB → Cloud Standby WAL Sync (Direct Connect)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Healthy</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Degraded</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Failed</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Standby</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Step-by-Step Incident Timeline */}
        {activeTab === 'timeline' && (
          <div className="p-6">
            {!activeIncident ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                No failure simulation active. Click <strong>"Simulate Failure & Trigger Recovery"</strong> above to generate a step-by-step incident timeline.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
                  <strong>Simulation Explanation:</strong> {activeIncident.explanation}
                  <div className="mt-1 font-semibold text-indigo-700">{activeIncident.recovery_guidance}</div>
                </div>

                <div className="relative border-l-2 border-indigo-200 ml-4 pl-4 space-y-4">
                  {activeIncident.recovery_steps.map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[25px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                        step.severity === 'err' ? 'bg-rose-500' : (step.severity === 'warn' ? 'bg-amber-500' : (step.severity === 'ok' ? 'bg-emerald-500' : 'bg-indigo-500'))
                      }`} />
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-800">
                        {step.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Academic Concept: Database Replica vs Backup */}
        {activeTab === 'academic' && (
          <div className="p-6 space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-700" />
                  Database Replica (High Availability)
                </h4>
                <p className="mb-2">
                  A standby replica runs an active database engine receiving a continuous stream of Write-Ahead Logs (WAL)
                  over the network.
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li><strong>Purpose:</strong> Rapid service failover (RTO &lt; 4 minutes).</li>
                  <li><strong>Limitation:</strong> Replicas automatically mirror human errors or SQL corruption (e.g. accidental <code>DROP TABLE</code> will replicate immediately!).</li>
                  <li><strong>Role in Hybrid Cloud:</strong> Provides cross-cloud high availability without keeping an expensive duplicate cluster active.</li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <h4 className="font-bold text-purple-900 text-sm mb-2 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-purple-700" />
                  Database Backup (Disaster Recovery & Point-in-Time)
                </h4>
                <p className="mb-2">
                  Backups are immutable, static point-in-time snapshots stored separately (e.g. encrypted S3 object vault).
                </p>
                <ul className="list-disc list-inside space-y-1 text-purple-800">
                  <li><strong>Purpose:</strong> Point-in-time recovery from data corruption, ransomware, or catastrophic failure.</li>
                  <li><strong>Limitation:</strong> Higher recovery time (RTO ~45-180m) to provision hardware and copy storage volumes.</li>
                  <li><strong>RPO Relation:</strong> Data loss is determined by backup frequency (e.g. taking snapshots every 4 hours means up to 4h of lost data).</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
              <strong>University Case Study Lesson:</strong> High availability requires <em>both</em> solutions. Replicas protect against unexpected hardware and network failures; backups protect against software bugs, operator errors, and malicious corruption.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
