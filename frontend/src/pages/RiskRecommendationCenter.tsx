import React, { useState, useEffect } from 'react';
import {
  CheckSquare, Award, AlertTriangle, ShieldCheck, Sliders,
  HelpCircle, ArrowRight, Zap, RefreshCw, Info, FileText, ChevronRight, CheckCircle2
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { api } from '../api/client';
import { RecommendationOutput, WeightCriteria } from '../types';

export const RiskRecommendationCenter: React.FC = () => {
  const { userConfig, setSelectedModel, setCurrentPage } = useSimulation();

  // Configurable criteria weights
  const [weights, setWeights] = useState<WeightCriteria>({
    cost: 25.0,
    availability: 25.0,
    recovery: 20.0,
    scalability: 15.0,
    security: 5.0,
    control: 5.0,
    simplicity: 5.0
  });

  const [recOutput, setRecOutput] = useState<RecommendationOutput | null>(null);
  const [activeTab, setActiveTab] = useState<'decision' | 'risks' | 'mappings'>('decision');
  const [loading, setLoading] = useState<boolean>(true);

  const calculateRec = async () => {
    setLoading(true);
    const res = await api.getRecommendations(weights);
    setRecOutput(res);
    setLoading(false);
  };

  useEffect(() => {
    calculateRec();
  }, [weights]);

  const updateWeight = (key: keyof WeightCriteria, val: number) => {
    setWeights(prev => ({ ...prev, [key]: val }));
  };

  const resetWeights = () => {
    setWeights({
      cost: 25.0,
      availability: 25.0,
      recovery: 20.0,
      scalability: 15.0,
      security: 5.0,
      control: 5.0,
      simplicity: 5.0
    });
  };

  // Preset sensitivity buttons
  const applyPreset = (preset: 'balanced' | 'disaster' | 'cost' | 'security') => {
    if (preset === 'balanced') {
      setWeights({ cost: 25, availability: 25, recovery: 20, scalability: 15, security: 5, control: 5, simplicity: 5 });
    } else if (preset === 'disaster') {
      setWeights({ cost: 10, availability: 35, recovery: 35, scalability: 10, security: 5, control: 3, simplicity: 2 });
    } else if (preset === 'cost') {
      setWeights({ cost: 45, availability: 15, recovery: 15, scalability: 10, security: 5, control: 5, simplicity: 5 });
    } else if (preset === 'security') {
      setWeights({ cost: 10, availability: 15, recovery: 15, scalability: 10, security: 30, control: 15, simplicity: 5 });
    }
  };

  // Case study risks
  const RISKS = [
    {
      id: "RISK-01",
      name: "Single Point of Database Failure (Catastrophic Outage)",
      severity: "Critical",
      likelihood: "High",
      business_impact: "Multi-day streaming outage (54h historical crisis), subscriber cancellations, brand damage.",
      characteristic: "On-Demand Self-Service & Elasticity",
      mitigation: "Automated multi-AZ / cross-cloud standby database replica with continuous WAL streaming replication.",
      status: "Mitigated in Hybrid / Public"
    },
    {
      id: "RISK-02",
      name: "Exponentially Rising Storage Costs",
      severity: "High",
      likelihood: "Certain",
      business_impact: "Over-provisioning on-premises SAN capacity for worst-case growth, inflating hardware budgets.",
      characteristic: "Resource Pooling & Elasticity",
      mitigation: "Tiered cloud object storage (S3 Standard for hot catalog, S3 Glacier for cold season archives).",
      status: "Mitigated via S3 Lifecycle Rules"
    },
    {
      id: "RISK-03",
      name: "Viral Viewing Peaks Exceeding Server Capacity",
      severity: "High",
      likelihood: "High",
      business_impact: "503 gateway errors and streaming stutter during live sports broadcasts or premieres.",
      characteristic: "Elasticity (Auto-Scaling)",
      mitigation: "Cloud bursting: Private core runs baseline, public cloud auto-scales overflow transcoders.",
      status: "Mitigated in Hybrid / Public"
    },
    {
      id: "RISK-04",
      name: "Slow Physical Hardware Procurement",
      severity: "Medium",
      likelihood: "High",
      business_impact: "6–12 week lead times when replacing failed server motherboards or SAN disk controllers.",
      characteristic: "On-Demand Self-Service",
      mitigation: "Infrastructure-as-Code (Terraform) provisions replacement nodes in seconds via Cloud APIs.",
      status: "Mitigated in Hybrid / Public"
    },
    {
      id: "RISK-05",
      name: "Public Cloud Egress Bandwidth Inflation",
      severity: "Medium",
      likelihood: "Medium",
      business_impact: "Unpredictable per-gigabyte egress invoicing for high-bitrate video delivery.",
      characteristic: "Resource Pooling (CDN Optimization)",
      mitigation: "Hybrid caching: Distribute media via volume-negotiated edge CDN while keeping internal APIs private.",
      status: "Protected in Hybrid"
    }
  ];

  // Section 12 Dedicated Case Study Mappings
  const CASE_MAPPINGS = [
    {
      risk: "Case Risk 1: Database failure interrupts streaming services for days (Historical Crisis)",
      characteristic: "On-Demand Self-Service & Elasticity",
      howItHelps: "On-demand self-service enables automated script-driven provisioning of replacement database nodes without manual technician intervention. Elasticity accommodates surges during transaction log replay.",
      qualification: "CRITICAL QUALIFICATION: Neither characteristic alone guarantees database recovery. True high availability requires an active standby replica receiving continuous transaction replication (WAL), automated DNS failover, and verified point-in-time snapshot backups.",
      recommendation: "Deploy an asynchronous standby database in AWS with automated failover (<4 min RTO)."
    },
    {
      risk: "Case Risk 2: Storage and infrastructure costs continue increasing exponentially",
      characteristic: "Resource Pooling & Elasticity",
      howItHelps: "Resource pooling leverages hyperscaler shared multi-tenant physical storage arrays, driving lower unit costs ($0.023/GB vs $115/TB SAN). Elasticity eliminates purchasing 5-year hardware buffers in advance.",
      qualification: "Unmanaged public cloud storage without automated lifecycle rules can become costly due to access tiers and egress bandwidth.",
      recommendation: "Implement S3 Intelligent-Tiering to auto-transition video files older than 90 days to Glacier."
    },
    {
      risk: "Case Risk 3: Traffic demand changes substantially during prime-time hours",
      characteristic: "Elasticity",
      howItHelps: "Dynamically scales out container tasks during the 8 PM – 10 PM viewer surge and scales in during early morning hours, eliminating 80% of idle off-peak hardware waste.",
      qualification: "Application code must be stateless, and auto-scaling policies must be tuned to prevent flapping.",
      recommendation: "Use containerized video packagers that launch on CPU > 75% or latency > 150ms."
    },
    {
      risk: "Case Risk 4: Provisioning replacement hardware takes weeks in physical datacenters",
      characteristic: "On-Demand Self-Service",
      howItHelps: "Engineers provision replacement virtual machines, managed databases, or object storage buckets instantly via API or CLI without waiting for physical vendor procurement.",
      qualification: "Requires strict IAM role-based access control and budget guardrails to prevent unauthorized or runaway resource creation.",
      recommendation: "Standardize all cloud infrastructure into version-controlled Terraform modules."
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Multi-Criteria Decision Analysis (MCDA)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Risk & Recommendation Decision Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Adjust decision criterion weights to dynamically calculate an evidence-based cloud deployment recommendation.
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('reports')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Export Formal Case Study Report</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/70 p-1.5 rounded-xl max-w-lg text-xs font-semibold">
        <button
          onClick={() => setActiveTab('decision')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            activeTab === 'decision' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Weighted Recommendation Engine
        </button>
        <button
          onClick={() => setActiveTab('mappings')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            activeTab === 'mappings' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Case Study Characteristic Mappings
        </button>
        <button
          onClick={() => setActiveTab('risks')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            activeTab === 'risks' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Risk Register (5 Items)
        </button>
      </div>

      {/* Tab 1: Decision Support Engine */}
      {activeTab === 'decision' && (
        <div className="space-y-6">
          {/* Winner Showcase Card */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-indigo-800 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold block mb-1">
                  Dynamic Mathematical Recommendation
                </span>
                <div className="text-2xl font-bold flex items-center gap-2 text-white">
                  <span>Winner: {recOutput?.winner_name}</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 max-w-3xl leading-relaxed">
                  {recOutput?.executive_summary}
                </p>
              </div>

              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-[11px] text-slate-400">Winning Composite Score</span>
                <span className="text-3xl font-black font-mono text-emerald-400">
                  {recOutput?.scores[0]?.total_score} <span className="text-sm font-sans font-normal text-slate-400">/ 100</span>
                </span>
                <button
                  onClick={() => {
                    if (recOutput?.recommended_model) {
                      setSelectedModel(recOutput.recommended_model as any);
                    }
                  }}
                  className="mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Apply to Simulation →
                </button>
              </div>
            </div>

            {/* Model Scores Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800">
              {recOutput?.scores.map(s => (
                <div
                  key={s.model}
                  className={`p-3.5 rounded-xl border transition-all ${
                    s.rank === 1
                      ? 'bg-indigo-600/30 border-indigo-500/50 text-white shadow-sm'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold capitalize">{s.model} Cloud</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      s.rank === 1 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>
                      Rank #{s.rank}
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {s.total_score} <span className="text-xs text-slate-400 font-sans font-normal">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weights Sliders Deck (1 Col) & Justification / Tradeoffs (2 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weight Sliders (1 Col) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Criteria Weightings
                </h3>
                <button
                  onClick={resetWeights}
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Reset
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pb-2 text-[11px] font-medium">
                <button onClick={() => applyPreset('balanced')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700">Balanced</button>
                <button onClick={() => applyPreset('disaster')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700">Disaster Priority</button>
                <button onClick={() => applyPreset('cost')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700">Cost Focus</button>
                <button onClick={() => applyPreset('security')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700">Security Focus</button>
              </div>

              <div className="space-y-3 text-xs">
                {Object.entries(weights).map(([k, v]) => (
                  <div key={k}>
                    <div className="flex justify-between mb-1 font-medium capitalize">
                      <span className="text-slate-600">{k}:</span>
                      <span className="font-mono font-bold text-indigo-600">{v}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={v}
                      onChange={e => updateWeight(k as keyof WeightCriteria, Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Reasons, Tradeoffs, and Migration Phases (2 Cols) */}
            <div className="lg:col-span-2 space-y-5">
              {/* Key Reasons */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Why {recOutput?.winner_name} Won:
                </h3>
                <div className="space-y-2 text-xs">
                  {recOutput?.key_reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 leading-relaxed">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trade-offs & Remaining Risks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs">
                  <h4 className="font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Architectural Trade-Offs
                  </h4>
                  <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                    {recOutput?.tradeoffs.map((t, i) => (
                      <li key={i} className="leading-snug">{t}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs">
                  <h4 className="font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    Recommended DR Strategy
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    {recOutput?.dr_guidance}
                  </p>
                </div>
              </div>

              {/* Suggested Migration Roadmap */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Suggested Phased Migration Roadmap
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {recOutput?.migration_phases.map((p, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-indigo-700 block mb-1">{p.phase}</span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{p.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Case Study Risk-to-Characteristic Mappings (Section 12) */}
      {activeTab === 'mappings' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
            <strong>Case Study Problem Mapping:</strong> This matrix explicitly links the video-streaming company's operational crises to core NIST cloud computing characteristics.
          </div>

          <div className="grid grid-cols-1 gap-4">
            {CASE_MAPPINGS.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm">{item.risk}</h3>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    NIST: {item.characteristic}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">How Characteristic Helps</span>
                    <p className="text-slate-700 leading-relaxed">{item.howItHelps}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">Important Qualification & Limitation</span>
                    <p className="text-slate-600 leading-relaxed bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/60">{item.qualification}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Required Architectural Configuration</span>
                    <p className="text-slate-700 leading-relaxed bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200/60 font-medium">{item.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Risk Register */}
      {activeTab === 'risks' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Enterprise Risk Register</h2>
              <p className="text-xs text-slate-500">Documenting likelihood, severity, and cloud mitigation status</p>
            </div>
            <span className="text-xs font-mono text-slate-400">ISO 31000 Framework</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Risk ID & Title</th>
                  <th className="px-6 py-3">Severity</th>
                  <th className="px-6 py-3">Business Impact</th>
                  <th className="px-6 py-3">Related Characteristic</th>
                  <th className="px-6 py-3">Mitigation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {RISKS.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <span className="text-[10px] font-mono text-slate-400">{r.id} • Likelihood: {r.likelihood}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.severity === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 leading-snug max-w-xs">{r.business_impact}</td>
                    <td className="px-6 py-3.5 text-indigo-700 font-medium">{r.characteristic}</td>
                    <td className="px-6 py-3.5">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
