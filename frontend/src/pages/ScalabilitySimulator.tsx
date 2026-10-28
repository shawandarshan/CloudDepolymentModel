import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, Server, Database, AlertTriangle, CheckCircle2,
  Sliders, ArrowUpRight, Zap, RefreshCw, Info, HardDrive, Cpu
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { api } from '../api/client';
import { ScalabilityOutput } from '../types';

export const ScalabilitySimulator: React.FC = () => {
  const { selectedModel, setSelectedModel, userConfig } = useSimulation();

  // Workload controls
  const [concurrentViewers, setConcurrentViewers] = useState<number>(35000);
  const [requestsPerSecond, setRequestsPerSecond] = useState<number>(12000);
  const [burstMultiplier, setBurstMultiplier] = useState<number>(2.5);
  const [baseCapacityUnits, setBaseCapacityUnits] = useState<number>(10);
  const [maxScalableUnits, setMaxScalableUnits] = useState<number>(30);
  const [dbConnectionsLimit, setDbConnectionsLimit] = useState<number>(1500);
  const [utilizationThreshold, setUtilizationThreshold] = useState<number>(75);

  const [simOutput, setSimOutput] = useState<ScalabilityOutput | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const runSimulation = async () => {
    setLoading(true);
    const res = await api.simulateScalability({
      deployment_model: selectedModel,
      concurrent_viewers: concurrentViewers,
      requests_per_second: requestsPerSecond,
      burst_multiplier: burstMultiplier,
      base_compute_capacity_units: baseCapacityUnits,
      max_scalable_units: maxScalableUnits,
      db_connections_limit: dbConnectionsLimit,
      utilization_threshold_pct: utilizationThreshold
    });
    setSimOutput(res);
    setLoading(false);
  };

  useEffect(() => {
    runSimulation();
  }, [
    selectedModel, concurrentViewers, requestsPerSecond, burstMultiplier,
    baseCapacityUnits, maxScalableUnits, dbConnectionsLimit, utilizationThreshold
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Elastic Workload Engine</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Workload & Auto-Scaling Simulator</h1>
          <p className="text-xs text-slate-500 mt-1">
            Observe how viral streaming viewership surges trigger elastic scaling or hardware saturation across cloud models.
          </p>
        </div>

        {/* Model Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Model:</span>
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

      {/* Main Grid: Controls (1 Col) & Live Output Gauges (2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Deck (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Traffic Workload Controls
            </h2>
            <span className="text-xs font-mono text-slate-400">Live Reaction</span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Concurrent Viewers */}
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-600">Base Concurrent Viewers:</span>
                <span className="font-mono font-bold text-indigo-600">{concurrentViewers.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="100000"
                step="5000"
                value={concurrentViewers}
                onChange={e => setConcurrentViewers(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Traffic Burst Multiplier */}
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-600">Traffic Surge Multiplier:</span>
                <span className="font-mono font-bold text-indigo-600">{burstMultiplier.toFixed(1)}x Peak</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.1"
                value={burstMultiplier}
                onChange={e => setBurstMultiplier(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Requests Per Second */}
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-600">API Requests / Second (RPS):</span>
                <span className="font-mono font-bold text-indigo-600">{requestsPerSecond.toLocaleString()} RPS</span>
              </div>
              <input
                type="range"
                min="2000"
                max="50000"
                step="2000"
                value={requestsPerSecond}
                onChange={e => setRequestsPerSecond(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Base Compute Capacity */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-600">Base Compute Units:</span>
                <span className="font-mono font-bold text-indigo-600">{baseCapacityUnits} instances</span>
              </div>
              <input
                type="range"
                min="4"
                max="25"
                step="1"
                value={baseCapacityUnits}
                onChange={e => setBaseCapacityUnits(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Max Scalable Units (for Cloud) */}
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-600">Max Auto-Scale Limit:</span>
                <span className="font-mono font-bold text-indigo-600">{maxScalableUnits} instances</span>
              </div>
              <input
                type="range"
                min="15"
                max="80"
                step="5"
                value={maxScalableUnits}
                onChange={e => setMaxScalableUnits(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400">Hard limit in Private Cloud; Elastic quota in Public/Hybrid</span>
            </div>

            {/* Database Connections Limit */}
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-600">Database Max Connections:</span>
                <span className="font-mono font-bold text-indigo-600">{dbConnectionsLimit} pool</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={dbConnectionsLimit}
                onChange={e => setDbConnectionsLimit(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Live Gauges & System Telemetry (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Status Banner */}
          <div className={`p-5 rounded-2xl border shadow-sm ${
            simOutput?.performance_status === 'Optimal'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : (simOutput?.performance_status.includes('Degraded')
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900')
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                {simOutput?.performance_status === 'Optimal' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                Workload Performance Status: {simOutput?.performance_status}
              </span>
              <span className="font-mono text-xs font-bold">
                Effective Viewers: {simOutput?.effective_concurrent_viewers.toLocaleString()}
              </span>
            </div>
            <p className="text-xs mt-1 leading-relaxed">
              <strong>Scaling Action:</strong> {simOutput?.scaling_action_taken}
            </p>
            <p className="text-xs mt-1 text-slate-600">
              {simOutput?.explanation}
            </p>
          </div>

          {/* Utilization Gauges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Compute Utilization */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Compute Utilization</span>
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className={`text-xl font-bold font-mono ${
                (simOutput?.compute_utilization_pct || 0) > 85 ? 'text-rose-600' : 'text-slate-900'
              }`}>
                {simOutput?.compute_utilization_pct}%
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    (simOutput?.compute_utilization_pct || 0) > 85 ? 'bg-rose-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, simOutput?.compute_utilization_pct || 0)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Instances: {simOutput?.instances_provisioned} active
              </span>
            </div>

            {/* Database Connections Load */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>DB Connection Pool</span>
                <Database className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className={`text-xl font-bold font-mono ${
                (simOutput?.db_load_pct || 0) > 80 ? 'text-amber-600' : 'text-slate-900'
              }`}>
                {simOutput?.db_connections_used} / {dbConnectionsLimit}
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, simOutput?.db_load_pct || 0)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Pool load: {simOutput?.db_load_pct}%
              </span>
            </div>

            {/* Capacity Shortfall */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Capacity Shortfall</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className={`text-xl font-bold font-mono ${
                (simOutput?.capacity_shortfall_pct || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {simOutput?.capacity_shortfall_pct}%
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, simOutput?.capacity_shortfall_pct || 0)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {(simOutput?.capacity_shortfall_pct || 0) > 0 ? 'Unserved traffic' : 'Zero unserved requests'}
              </span>
            </div>

            {/* Elasticity Rating */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Model Elasticity</span>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {simOutput?.elasticity_rating}
              </div>
              <span className="text-[10px] text-slate-500 block mt-2">
                Cost delta: +${simOutput?.estimated_cost_change_usd}/mo
              </span>
            </div>
          </div>

          {/* Academic Educational Cards: 3 NIST Characteristics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-950 space-y-1.5">
              <h3 className="font-bold flex items-center gap-1.5 text-indigo-900">
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                1. Elasticity
              </h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                The ability to dynamically provision and release compute/transcoding instances as viewer traffic fluctuates.
                Prevents paying for idle hardware at midnight while avoiding crashes during prime time.
              </p>
            </div>

            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 text-xs text-blue-950 space-y-1.5">
              <h3 className="font-bold flex items-center gap-1.5 text-blue-900">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                2. Resource Pooling
              </h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Provider infrastructure is pooled to serve multiple customers across availability zones.
                Eliminates the single database hardware bottleneck that crippled the on-premises streaming datacenter.
              </p>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-950 space-y-1.5">
              <h3 className="font-bold flex items-center gap-1.5 text-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                3. On-Demand Self-Service
              </h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Authorized engineers spin up replacement database nodes, storage volumes, or transcoders via API or Console in seconds
                without waiting for physical hardware procurement cycles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
