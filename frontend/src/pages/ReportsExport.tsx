import React, { useState, useEffect } from 'react';
import {
  FileText, Printer, Download, Share2, CheckCircle2, ShieldCheck,
  Building, Calendar, HardDrive, DollarSign, Database, Clock
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { api } from '../api/client';

export const ReportsExport: React.FC = () => {
  const { selectedModel, userConfig, activeIncident, activeUsers, storageTb } = useSimulation();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await api.getDashboard(selectedModel);
      const rec = await api.getRecommendations();
      const costs = await api.calculateCosts({
        model: selectedModel,
        currency: userConfig.currency,
        compute_instances: 8,
        storage_tb: storageTb,
        active_users: activeUsers
      });

      setReport({
        title: `StreamCloud Intelligence: Cloud Deployment Model & Disaster Recovery Analysis for ${userConfig.company_name}`,
        company: userConfig.company_name,
        currency: userConfig.currency,
        symbol: userConfig.currency_symbol,
        date: new Date().toLocaleString(),
        model: selectedModel.toUpperCase() + ' CLOUD',
        activeUsers,
        storageTb,
        costs,
        rec,
        activeIncident
      });
      setLoading(false);
    }
    load();
  }, [selectedModel, userConfig, activeIncident, activeUsers, storageTb]);

  const handlePrint = () => {
    window.print();
  };

  const exportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streamcloud-case-study-report-${selectedModel}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCostCSV = () => {
    if (!report?.costs) return;
    let csv = `Category,USD Amount,Display Amount (${userConfig.currency}),Percentage\n`;
    report.costs.breakdown.forEach((item: any) => {
      csv += `"${item.category}",${item.amount_usd},${item.amount_display},${item.percentage}%\n`;
    });
    csv += `\nTotal Monthly,,${report.costs.monthly_cost_display},\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cost-analysis-${selectedModel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar (hidden in print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Academic Case Study Deliverable</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Comprehensive Cloud Computing Report & Exports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Formally synthesized case study report ready for printing, submission, and data export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCostCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Cost CSV
          </button>
          <button
            onClick={exportJSON}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="print-page bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-lg space-y-8 max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">
              STREAMCLOUD INTELLIGENCE • CASE STUDY REPORT
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
              Cloud Deployment Model & Disaster Recovery Analysis
            </h1>
            <p className="text-sm font-medium text-slate-600 mt-1">
              Prepared for: <strong>{userConfig.company_name}</strong>
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-500 font-mono">
            <div>Date: {report?.date}</div>
            <div>Model: {report?.model}</div>
            <div>Status: Evaluated</div>
          </div>
        </div>

        {/* 1. Executive Problem Statement */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            1. Problem Statement & Case Study Context
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            {userConfig.company_name} currently operates its own dedicated on-premises data centers. Recently, a catastrophic
            primary database hardware failure unmounted storage partitions with zero automated standby failover, resulting in
            over <strong>54 hours of continuous streaming service interruption</strong>. Concurrently, video asset libraries are
            ballooning beyond initial projections, causing on-premises SAN storage and operational staff expenditures to escalate
            unsustainably.
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">
            The organization must evaluate <strong>Public Cloud, Private Cloud, and Hybrid Cloud</strong> models to determine the optimal
            architecture balancing disaster recovery resilience (sub-5 minute RTO), cost elasticity, and data security governance.
          </p>
        </section>

        {/* 2. Key Objectives */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            2. Strategic Architecture Objectives
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">Objective 1: Eliminate Single Points of Failure</strong>
              Achieve an RTO of &lt; 15 minutes and RPO &lt; 15 minutes via automated replication and failover.
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">Objective 2: Elastic Storage Governance</strong>
              Halt exponential SAN capital expenses by tiering cold video catalogs into cloud object stores.
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">Objective 3: Prime-Time Elasticity</strong>
              Dynamically absorb 2.5x traffic surges during 8 PM – 10 PM prime time without buying permanent servers.
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">Objective 4: Regulatory Compliance</strong>
              Preserve subscriber billing and viewing records in private governance boundaries.
            </div>
          </div>
        </section>

        {/* 3. NIST Cloud Characteristics Mapping */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            3. Mapping Case Study Risks to NIST Cloud Characteristics
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-800 font-bold">
                <tr>
                  <th className="p-2.5 border-b border-slate-200">Case Study Risk</th>
                  <th className="p-2.5 border-b border-slate-200">NIST Characteristic</th>
                  <th className="p-2.5 border-b border-slate-200">Technical Solution</th>
                  <th className="p-2.5 border-b border-slate-200">Architectural Qualification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] leading-snug">
                <tr>
                  <td className="p-2.5 font-bold text-slate-900">Database Multi-Day Outage</td>
                  <td className="p-2.5 font-mono text-indigo-700">On-Demand Self-Service</td>
                  <td className="p-2.5 text-slate-700">Automated failover to cloud standby database.</td>
                  <td className="p-2.5 text-amber-800 bg-amber-50/40">Self-service alone does not recover data; requires active WAL replication.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-900">Rising Media Storage Expenses</td>
                  <td className="p-2.5 font-mono text-indigo-700">Resource Pooling</td>
                  <td className="p-2.5 text-slate-700">S3 Lifecycle rules to auto-transition cold files to Glacier.</td>
                  <td className="p-2.5 text-slate-600">Must configure lifecycle rules to avoid unexpected access tier retrieval fees.</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-900">Viral Streaming Traffic Surges</td>
                  <td className="p-2.5 font-mono text-indigo-700">Elasticity</td>
                  <td className="p-2.5 text-slate-700">Cloud bursting auto-scales transcoders during peak viewing.</td>
                  <td className="p-2.5 text-slate-600">Requires stateless container workers and warm standby pools.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Financial Cost Comparison */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            4. Quantitative Financial Analysis & OpEx Run-Rates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Evaluated Monthly Run-Rate</span>
              <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                {report?.costs ? `${report.symbol}${report.costs.monthly_cost_display.toLocaleString()}` : '...'}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Monthly Savings vs Baseline</span>
              <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                {report?.costs ? `${report.symbol}${report.costs.monthly_savings_vs_baseline_display.toLocaleString()}` : '...'}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Cost / 1,000 Active Viewers</span>
              <div className="text-base font-bold font-mono text-slate-800 mt-0.5">
                {report?.costs ? `${report.symbol}${report.costs.cost_per_1k_users_display}` : '...'}
              </div>
            </div>
          </div>
        </section>

        {/* 5. Formal Architecture Recommendation */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            5. Evidence-Based Recommendation & Implementation Plan
          </h2>
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-950 space-y-2">
            <div className="font-bold text-sm text-indigo-900">
              Target Architecture: {report?.rec?.winner_name}
            </div>
            <p className="leading-relaxed text-slate-700">
              {report?.rec?.executive_summary}
            </p>
            <div className="pt-2 border-t border-indigo-200/60 font-medium text-indigo-800">
              <strong>Disaster Recovery Blueprint:</strong> {report?.rec?.dr_guidance}
            </div>
          </div>
        </section>

        {/* 6. Academic Limitations */}
        <section className="space-y-2 text-[11px] text-slate-500 border-t border-slate-200 pt-4">
          <strong className="text-slate-700 block">Simulation Disclaimers & Assumptions:</strong>
          All operational measurements, recovery times, and cost estimates presented in this report represent illustrative
          models constructed for an academic Cloud Computing case study demonstration. Egress data transfer fees and actual cloud
          SLA availability depend on contracted provider terms and architectural redundancy testing.
        </section>
      </div>
    </div>
  );
};
