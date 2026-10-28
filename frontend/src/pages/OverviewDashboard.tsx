import React, { useState, useEffect } from 'react';
import {
  Users, HardDrive, DollarSign, Activity, AlertCircle, Clock,
  TrendingDown, ArrowUpRight, ShieldCheck, ShieldAlert, CheckCircle2,
  RefreshCw, Play, Layers
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { useSimulation } from '../context/SimulationContext';
import { api } from '../api/client';

export const OverviewDashboard: React.FC = () => {
  const {
    selectedModel, setSelectedModel, setCurrentPage, userConfig,
    activeIncident, activeUsers, setActiveUsers, storageTb, setStorageTb
  } = useSimulation();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboard = async () => {
    setLoading(true);
    const data = await api.getDashboard(selectedModel);
    setDashboardData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedModel]);

  const currencySymbol = userConfig.currency_symbol || '₹';

  // Format currency
  const formatCost = (val: number) => {
    if (val >= 100000) return `${currencySymbol}${(val / 100000).toFixed(2)} Lakh`;
    return `${currencySymbol}${val.toLocaleString()}`;
  };

  const costComparisonData = dashboardData?.all_models_cost_comparison
    ? [
        { model: 'Public Cloud', cost: dashboardData.all_models_cost_comparison.public, fill: '#3b82f6' },
        { model: 'Private Cloud', cost: dashboardData.all_models_cost_comparison.private, fill: '#8b5cf6' },
        { model: 'Hybrid Cloud', cost: dashboardData.all_models_cost_comparison.hybrid, fill: '#10b981' }
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Case Study Context Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>{userConfig.company_name}</span>
              <span>•</span>
              <span>Cloud Architecture Evaluation</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Executive Cloud Analytics & Resilience Dashboard</h1>
            <p className="text-slate-300 text-xs mt-1.5 max-w-2xl leading-relaxed">
              Evaluating the transition from fragile on-premises data centers to Public, Private, or Hybrid Cloud.
              Remediating the historic 54-hour database outage while arresting spiraling media storage expenditures.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setCurrentPage('dr-lab')}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <ShieldAlert className="w-4 h-4" />
              Launch Disaster Recovery Lab
            </button>
            <button
              onClick={() => setCurrentPage('cost-explorer')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
            >
              Explore Costs
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Model & Availability */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Deployment Model & SLA</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 capitalize flex items-center gap-2">
            {selectedModel} Cloud
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              {dashboardData?.availability_sla || 99.95}% SLA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Target RTO: {userConfig.rto_target_minutes}m | RPO: {userConfig.rpo_target_minutes}m</span>
          </p>
        </div>

        {/* Active Simulated Viewers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Concurrent Viewers</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {activeIncident ? (
              <span className="text-rose-600">
                {(activeUsers - activeIncident.affected_users).toLocaleString()} <span className="text-xs font-sans text-rose-500">(-{activeIncident.affected_users.toLocaleString()} degraded)</span>
              </span>
            ) : (
              `${activeUsers.toLocaleString()} Viewers`
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Peak bandwidth: 48.9 Gbps</span>
            <button
              onClick={() => setCurrentPage('scalability')}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Simulate burst →
            </button>
          </p>
        </div>

        {/* Estimated Monthly Cost */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Estimated Monthly Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700">
            {dashboardData ? formatCost(dashboardData.monthly_cost_display) : '...'}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1 text-emerald-600 font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Saves {dashboardData ? formatCost(dashboardData.monthly_savings_vs_baseline) : '...'} / mo vs on-prem</span>
          </p>
        </div>

        {/* Storage Consumed vs Capacity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Media Storage Utilization</span>
            <HardDrive className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 flex items-center justify-between">
            <span>{storageTb.toFixed(1)} TB</span>
            <span className="text-xs text-slate-500 font-sans font-normal">of {dashboardData?.storage_capacity_tb || 25} TB</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (storageTb / (dashboardData?.storage_capacity_tb || 25)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Profile Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">24-Hour Streaming Traffic & Bandwidth Profile</h2>
              <p className="text-xs text-slate-400">Deterministic viewer curve showing prime-time burst at 20:00–22:00</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 text-indigo-600 font-medium">
                <span className="w-2.5 h-2.5 bg-indigo-600 rounded-sm" /> Viewers
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400 font-medium ml-2">
                <span className="w-2.5 h-2.5 bg-indigo-200 rounded-sm" /> Bandwidth (Gbps)
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData?.traffic_points || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any, name: string) => [
                    name === 'users' ? `${val.toLocaleString()} viewers` : `${val} Gbps`,
                    name === 'users' ? 'Active Viewers' : 'Egress Bandwidth'
                  ]}
                />
                <Area type="monotone" dataKey="users" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#trafficGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Comparison Bar Chart (1 Col) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-800">Monthly Cost by Cloud Model</h2>
              <button
                onClick={() => setCurrentPage('cost-explorer')}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Calculator →
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">Comparing operational spend at current 12 TB & 25k users</p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="model" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/100000).toFixed(1)}L`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(v: any) => [formatCost(Number(v)), 'Monthly Cost']}
                  />
                  <Bar dataKey="cost" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>On-prem baseline:</span>
            <span className="font-mono font-semibold text-slate-800">{formatCost(19500 * (userConfig.currency === 'INR' ? userConfig.exchange_rate_to_inr : 1))}</span>
          </div>
        </div>
      </div>

      {/* Incident History & Case Study Reference Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Incident History & Resilience Records</h2>
            <p className="text-xs text-slate-500">Documenting catastrophic database failure vs modern cloud disaster recovery simulations</p>
          </div>
          <button
            onClick={() => setCurrentPage('dr-lab')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Run New Failure Test <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Incident Code</th>
                <th className="px-6 py-3">Scenario / Title</th>
                <th className="px-6 py-3">Model</th>
                <th className="px-6 py-3">Severity</th>
                <th className="px-6 py-3">Simulated Downtime</th>
                <th className="px-6 py-3">RTO Target Status</th>
                <th className="px-6 py-3">Data Loss Estimate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Highlight historical case study disaster first */}
              <tr className="hover:bg-slate-50/70 transition-colors bg-rose-50/30">
                <td className="px-6 py-3.5 font-mono font-semibold text-slate-700">INC-8921-CRISIS</td>
                <td className="px-6 py-3.5">
                  <div className="font-semibold text-slate-900">CASE STUDY: Primary Database SAN Crash</div>
                  <div className="text-[11px] text-slate-500">Historical crisis that motivated cloud evaluation. No standby replica configured.</div>
                </td>
                <td className="px-6 py-3.5 capitalize font-medium text-slate-700">Private (On-Prem)</td>
                <td className="px-6 py-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
                    Critical Outage
                  </span>
                </td>
                <td className="px-6 py-3.5 font-mono font-bold text-rose-600">54.0 Hours (3,240 min)</td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    BREACHED (Target: 15m)
                  </span>
                </td>
                <td className="px-6 py-3.5 text-slate-600 font-mono">24+ hours metadata</td>
              </tr>

              {/* Dynamic simulated incidents */}
              {dashboardData?.recent_incidents?.filter((i: any) => i.incident_code !== 'INC-8921-CRISIS').map((inc: any) => (
                <tr key={inc.id || inc.incident_code} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-slate-600">{inc.incident_code}</td>
                  <td className="px-6 py-3.5 font-medium text-slate-900">{inc.title}</td>
                  <td className="px-6 py-3.5 capitalize text-slate-700">{inc.model} Cloud</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      inc.severity === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-mono font-semibold text-slate-800">{inc.downtime_minutes} min</td>
                  <td className="px-6 py-3.5">
                    {inc.rto_breached ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> BREACHED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> WITHIN SLA
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 font-mono">{inc.data_loss_estimate || '0 MB'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloud Architecture Recommendation Callout Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-1">
            Decision Recommendation Engine
          </span>
          <h3 className="text-base font-bold text-slate-900">
            Recommended Target Architecture: Hybrid Cloud (Private Core + Cloud DR Standby)
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Eliminates the single point of failure by deploying an automated asynchronous cloud standby database (&lt;4m RTO),
            while tiering cold video archives into Amazon S3 / Google Cloud Storage to halt exponentially rising storage costs.
          </p>
        </div>
        <button
          onClick={() => setCurrentPage('recommendations')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0"
        >
          View Full Evaluation Matrix →
        </button>
      </div>
    </div>
  );
};
