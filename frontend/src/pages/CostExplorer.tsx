import React, { useState, useEffect } from 'react';
import {
  Coins, DollarSign, TrendingDown, TrendingUp, Download, RotateCcw,
  Sliders, Calendar, PieChart as PieIcon, BarChart3, HelpCircle, HardDrive
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell
} from 'recharts';
import { useSimulation } from '../context/SimulationContext';
import { api } from '../api/client';
import { CostCalculationOutput } from '../types';

export const CostExplorer: React.FC = () => {
  const { selectedModel, setSelectedModel, userConfig } = useSimulation();

  // Inputs
  const [computeInstances, setComputeInstances] = useState<number>(8);
  const [storageTb, setStorageTb] = useState<number>(12.0);
  const [monthlyGrowthPct, setMonthlyGrowthPct] = useState<number>(8.0);
  const [monthlyDataTransferTb, setMonthlyDataTransferTb] = useState<number>(45.0);
  const [activeUsers, setActiveUsers] = useState<number>(25000);
  const [dbInstances, setDbInstances] = useState<number>(2);
  const [backupStorageTb, setBackupStorageTb] = useState<number>(15.0);
  const [supportCost, setSupportCost] = useState<number>(600.0);
  const [onpremBaseline, setOnpremBaseline] = useState<number>(19500.0);
  const [privateCapex, setPrivateCapex] = useState<number>(180000.0);
  const [amortizationMonths, setAmortizationMonths] = useState<number>(36);

  const [costData, setCostData] = useState<CostCalculationOutput | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const recalculate = async () => {
    setLoading(true);
    const res = await api.calculateCosts({
      model: selectedModel,
      currency: userConfig.currency,
      compute_instances: computeInstances,
      storage_tb: storageTb,
      monthly_storage_growth_pct: monthlyGrowthPct,
      monthly_data_transfer_tb: monthlyDataTransferTb,
      active_users: activeUsers,
      db_instances: dbInstances,
      backup_storage_tb: backupStorageTb,
      support_fixed_monthly: supportCost,
      onprem_baseline_monthly: onpremBaseline,
      private_capex_hardware: privateCapex,
      amortization_months: amortizationMonths
    });
    setCostData(res);
    setLoading(false);
  };

  useEffect(() => {
    recalculate();
  }, [
    selectedModel, userConfig.currency, computeInstances, storageTb,
    monthlyGrowthPct, monthlyDataTransferTb, activeUsers, dbInstances,
    backupStorageTb, supportCost, onpremBaseline, privateCapex, amortizationMonths
  ]);

  const resetToDefaults = () => {
    setComputeInstances(8);
    setStorageTb(12.0);
    setMonthlyGrowthPct(8.0);
    setMonthlyDataTransferTb(45.0);
    setActiveUsers(25000);
    setDbInstances(2);
    setBackupStorageTb(15.0);
    setSupportCost(600.0);
    setOnpremBaseline(19500.0);
    setPrivateCapex(180000.0);
    setAmortizationMonths(36);
  };

  const exportCSV = () => {
    if (!costData) return;
    let csv = `Category,Amount (USD),Amount (${userConfig.currency}),Percentage (%)\n`;
    costData.breakdown.forEach(item => {
      csv += `"${item.category}",${item.amount_usd},${item.amount_display},${item.percentage}%\n`;
    });
    csv += `\nTotal Monthly Cost,,${costData.monthly_cost_display},\n`;
    csv += `Total Annual Cost,,${costData.annual_cost_display},\n`;
    csv += `Baseline Monthly Savings,,${costData.monthly_savings_vs_baseline_display},\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streamcloud-cost-analysis-${selectedModel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const symbol = costData?.currency_symbol || userConfig.currency_symbol || '₹';
  const formatMoney = (v: number) => {
    if (v >= 100000) return `${symbol}${(v / 100000).toFixed(2)} Lakh`;
    return `${symbol}${v.toLocaleString()}`;
  };

  const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#64748b'];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Coins className="w-4 h-4" />
            <span>Interactive Financial Analytics</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Cloud Cost Explorer & 12-Month Forecast</h1>
          <p className="text-xs text-slate-500 mt-1">
            Transparently model compute, storage, egress, and disaster recovery expenses with configurable growth parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefaults}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Model Selection Tabs */}
      <div className="flex bg-slate-200/70 p-1.5 rounded-xl max-w-md text-xs font-semibold">
        {(['public', 'private', 'hybrid'] as const).map(m => (
          <button
            key={m}
            onClick={() => setSelectedModel(m)}
            className={`flex-1 py-2 rounded-lg capitalize transition-all ${
              selectedModel === m ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {m === 'hybrid' ? '⚡ Hybrid Cloud' : (m === 'public' ? '🌐 Public Cloud' : '🏢 Private Cloud')}
          </button>
        ))}
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500">Estimated Monthly Total</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            {costData ? formatMoney(costData.monthly_cost_display) : '...'}
          </div>
          <span className="text-[10px] text-slate-400">Sum of 6 itemized categories</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500">Projected Annual Cost</span>
          <div className="text-lg font-bold font-mono text-indigo-700 mt-1">
            {costData ? formatMoney(costData.annual_cost_display) : '...'}
          </div>
          <span className="text-[10px] text-slate-400">12 × monthly run-rate</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500">Cost / 1,000 Active Users</span>
          <div className="text-lg font-bold font-mono text-slate-800 mt-1">
            {costData ? `${symbol}${costData.cost_per_1k_users_display}` : '...'}
          </div>
          <span className="text-[10px] text-slate-400">Unit subscriber efficiency</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500">Cost / TB Stored Data</span>
          <div className="text-lg font-bold font-mono text-purple-700 mt-1">
            {costData ? `${symbol}${costData.cost_per_tb_display}` : '...'}
          </div>
          <span className="text-[10px] text-slate-400">Inclusive of cold tiers</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500">Savings vs On-Prem Baseline</span>
          <div className="text-lg font-bold font-mono text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingDown className="w-4 h-4" />
            {costData ? formatMoney(costData.monthly_savings_vs_baseline_display) : '...'}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {costData?.break_even_months ? `Break-even: ~${costData.break_even_months} mos` : 'Immediate OpEx reduction'}
          </span>
        </div>
      </div>

      {/* Main Grid: Inputs Panel (1 Col) & Breakdown / Forecast Charts (2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders & Parameters (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Infrastructure Inputs
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Live Validation</span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Storage in TB */}
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-600">Video Storage Capacity:</span>
                <span className="font-mono font-bold text-indigo-600">{storageTb} TB</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={storageTb}
                onChange={e => setStorageTb(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Storage Growth % */}
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-600">Monthly Video Growth:</span>
                <span className="font-mono font-bold text-indigo-600">{monthlyGrowthPct}% / mo</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={monthlyGrowthPct}
                onChange={e => setMonthlyGrowthPct(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Compute Instances */}
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-600">App Compute Instances:</span>
                <span className="font-mono font-bold text-indigo-600">{computeInstances} nodes (4 vCPU / 16GB)</span>
              </div>
              <input
                type="range"
                min="2"
                max="40"
                step="1"
                value={computeInstances}
                onChange={e => setComputeInstances(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Monthly Data Transfer TB */}
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-600">Monthly Egress Transfer:</span>
                <span className="font-mono font-bold text-indigo-600">{monthlyDataTransferTb} TB</span>
              </div>
              <input
                type="range"
                min="5"
                max="300"
                step="5"
                value={monthlyDataTransferTb}
                onChange={e => setMonthlyDataTransferTb(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Active Users */}
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-600">Active Concurrent Users:</span>
                <span className="font-mono font-bold text-indigo-600">{activeUsers.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="2000"
                max="100000"
                step="2000"
                value={activeUsers}
                onChange={e => setActiveUsers(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Database Instances */}
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-600">Database Instances:</span>
                <span className="font-mono font-bold text-indigo-600">{dbInstances} (Clustered)</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={dbInstances}
                onChange={e => setDbInstances(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Private Capex (if Private/Hybrid) */}
            {selectedModel !== 'public' && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between mb-1 font-medium">
                  <span className="text-slate-600">Hardware Capex (USD):</span>
                  <span className="font-mono font-bold text-indigo-600">${privateCapex.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="350000"
                  step="10000"
                  value={privateCapex}
                  onChange={e => setPrivateCapex(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] text-slate-400">Amortized over {amortizationMonths} months</span>
              </div>
            )}
          </div>
        </div>

        {/* Charts & Breakdown (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 12-Month Projected Growth Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">12-Month Cost & Storage Growth Projection</h3>
                <p className="text-xs text-slate-500">
                  Compounding at {monthlyGrowthPct}% monthly video archive growth (Month 1: {storageTb} TB → Month 12: {costData?.twelve_month_projection[11]?.storage_tb} TB)
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={costData?.twelve_month_projection || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickFormatter={m => `M${m}`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `${(v/100000).toFixed(1)}L`} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    formatter={(v: any, name: string) => [
                      formatMoney(Number(v)),
                      name === 'hybrid_cost' ? 'Hybrid Cloud' : (name === 'public_cost' ? 'Public Cloud' : (name === 'private_cost' ? 'Private Cloud' : 'On-Prem Baseline'))
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="hybrid_cost" stroke="#10b981" strokeWidth={2.5} name="Hybrid Cloud" />
                  <Line type="monotone" dataKey="public_cost" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" name="Public Cloud" />
                  <Line type="monotone" dataKey="private_cost" stroke="#8b5cf6" strokeWidth={2} name="Private Cloud" />
                  <Line type="monotone" dataKey="onprem_baseline" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 3" name="On-Prem Baseline" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Itemized Cost Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Itemized Cost Breakdown ({selectedModel.toUpperCase()} CLOUD)</h3>
              <span className="text-xs font-mono font-semibold text-indigo-700">Total: {costData ? formatMoney(costData.monthly_cost_display) : '...'}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/60 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-2.5">Category</th>
                    <th className="px-5 py-2.5">Specification & Scope</th>
                    <th className="px-5 py-2.5 text-right">Amount ({userConfig.currency})</th>
                    <th className="px-5 py-2.5 text-right">Share (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {costData?.breakdown.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-2.5 font-sans font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                        {item.category}
                      </td>
                      <td className="px-5 py-2.5 font-sans text-slate-500">{item.description}</td>
                      <td className="px-5 py-2.5 text-right font-bold text-slate-800">{formatMoney(item.amount_display)}</td>
                      <td className="px-5 py-2.5 text-right text-slate-600">{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
