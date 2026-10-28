import React, { useState, useEffect } from 'react';
import {
  GitCompare, CheckCircle2, XCircle, AlertTriangle, ShieldCheck,
  ChevronDown, ChevronUp, Info, HelpCircle, Layers, ArrowRight
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { useSimulation } from '../context/SimulationContext';
import { api } from '../api/client';

export const CloudModelComparison: React.FC = () => {
  const { selectedModel, setSelectedModel, userConfig, setCurrentPage } = useSimulation();

  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});

  const toggleExpand = (name: string) => {
    setExpandedCriteria(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const symbol = userConfig.currency_symbol || '₹';

  // 17 Comprehensive comparison criteria
  const COMPARISON_ROWS = [
    {
      category: "Disaster Recovery & Resiliency",
      name: "Recovery Time Objective (RTO)",
      public: "2.0 minutes (Automated Multi-AZ RDS failover)",
      private: "48–72 hours (Offsite tape restore without secondary DC)",
      hybrid: "3.5 minutes (Cloud pilot-light standby database replica)",
      winner: "public",
      detail: "Directly addresses the case study database outage. Public and Hybrid provide automated sub-5 minute failover, whereas dedicated on-premises without a redundant datacenter took over 2 days."
    },
    {
      category: "Disaster Recovery & Resiliency",
      name: "Recovery Point Objective (RPO)",
      public: "< 30 seconds (Synchronous Multi-AZ block replication)",
      private: "24 hours (Daily offsite tape backup lag)",
      hybrid: "< 15 seconds (Continuous asynchronous WAL streaming)",
      winner: "hybrid",
      detail: "RPO determines max data loss. Streaming WAL to an asynchronous cloud standby ensures almost zero lost transactions while avoiding synchronous cross-WAN write latency penalties."
    },
    {
      category: "Disaster Recovery & Resiliency",
      name: "Availability SLA Guarantee",
      public: "99.99% (Financially backed cloud SLA)",
      private: "94.50% (Susceptible to local utility/power failures)",
      hybrid: "99.95% (Cross-boundary redundancy across DC + Cloud)",
      winner: "public",
      detail: "99.99% equates to less than 5 minutes of unplanned downtime per month, compared to 94.5% which allows ~40 hours of downtime per month."
    },
    {
      category: "Cost & Financial Structure",
      name: "Initial Setup & Capital Expense (Capex)",
      public: `${symbol}4.17 Lakh (Minimal initial setup & cloud IAM setup)`,
      private: `${symbol}1.5 Crore (Server racks, SAN storage, dual power grids)`,
      hybrid: `${symbol}29.2 Lakh (Direct Connect link + hybrid cloud gateways)`,
      winner: "public",
      detail: "Private cloud incurs heavy upfront equipment capital expenditure and long depreciation horizons, while public cloud converts hardware into OpEx."
    },
    {
      category: "Cost & Financial Structure",
      name: "Estimated Monthly Operating Cost (OpEx)",
      public: `${symbol}5.18 Lakh / mo (Pay-as-you-go instances & S3)`,
      private: `${symbol}15.4 Lakh / mo (Power, cooling, 24/7 datacenter staff)`,
      hybrid: `${symbol}7.01 Lakh / mo (Optimized private core + cloud burst)`,
      winner: "public",
      detail: "Hybrid cloud balances existing amortized servers for base workload with cheap elastic cloud storage and spot transcoding nodes."
    },
    {
      category: "Cost & Financial Structure",
      name: "Storage Cost & Lifecycle Tiering",
      public: "Pay-per-GB ($0.023 hot / $0.004 cold Glacier)",
      private: "Fixed SAN array ($115/TB/mo amortized)",
      hybrid: "Tiered (Hot catalog on NVMe + Cold media in S3 IA)",
      winner: "hybrid",
      detail: "Solves case study risk of spiraling video storage expenses. S3 lifecycle rules automatically move aging video seasons into deep archive tiers."
    },
    {
      category: "Cost & Financial Structure",
      name: "Network & Data Transfer (Egress)",
      public: "High ($0.08 / GB egress bandwidth to Internet)",
      private: "Fixed ($2,800/mo leased dedicated transit)",
      hybrid: "Optimized (CDN volume pricing + $1,200/mo Direct Connect)",
      winner: "hybrid",
      detail: "Pure public cloud video streaming generates massive egress invoices. Hybrid keeps local CDN origins with negotiated peering links."
    },
    {
      category: "Scalability & Elasticity",
      name: "Elastic Auto-Scaling",
      public: "Score 98/100 (Instant launch of hundreds of container tasks)",
      private: "Score 38/100 (Hard limit capped by physical rack server count)",
      hybrid: "Score 90/100 (Private core handles base, cloud absorbs spikes)",
      winner: "public",
      detail: "Cloud Elasticity enables horizontal scaling during live sports finals or viral premieres, scaling down when viewers sleep."
    },
    {
      category: "Scalability & Elasticity",
      name: "Resource Pooling & Utilization",
      public: "Multi-tenant hyperscale dynamic pooling",
      private: "Dedicated single-tenant hardware (idle off-peak)",
      hybrid: "High (Private compute + pooled cloud object storage)",
      winner: "hybrid",
      detail: "Resource pooling eliminates purchasing 50 physical servers just for prime time that sit idle at 4 AM."
    },
    {
      category: "Scalability & Elasticity",
      name: "On-Demand Self-Service",
      public: "Automated provisioning via API & Console in seconds",
      private: "Manual purchase orders & physical cabling (6–12 weeks)",
      hybrid: "Automated cloud bursts via Terraform & Kubernetes",
      winner: "public",
      detail: "Engineers provision replacement transcoders or staging databases on-demand without manual provider intervention."
    },
    {
      category: "Security & Governance",
      name: "Security, Privacy & Data Sovereignty",
      public: "Score 78/100 (Shared responsibility security model)",
      private: "Score 96/100 (Complete physical isolation in own datacenter)",
      hybrid: "Score 92/100 (PII & billing kept private; video in cloud)",
      winner: "private",
      detail: "Hybrid keeps sensitive subscriber credit card and viewing habits in the private core, fulfilling strict broadcast licensing mandates."
    },
    {
      category: "Security & Governance",
      name: "Infrastructure Control & Customization",
      public: "Low (Underlying physical hypervisor/network opaque)",
      private: "Total (Full BIOS, kernel, firmware, and network control)",
      hybrid: "High (Private core control + standard cloud endpoints)",
      winner: "private",
      detail: "Private cloud provides complete root access to bare-metal hardware and storage buses."
    },
    {
      category: "Operations & Management",
      name: "Maintenance Responsibility",
      public: "Provider manages physical hardware, power, and hypervisors",
      private: "Internal company team manages all physical facilities",
      hybrid: "Shared (Internal manages DC; cloud provider manages VPC)",
      winner: "public",
      detail: "Eliminates night-shift server rack repairs and diesel generator testing."
    },
    {
      category: "Operations & Management",
      name: "Operational Complexity",
      public: "Low-to-Medium (Requires cloud architecture & IAM skills)",
      private: "Very High (Requires hardware, SAN, networking, and HVAC staff)",
      hybrid: "Medium (Requires dual-environment orchestration tooling)",
      winner: "public",
      detail: "Hybrid requires monitoring tools (Prometheus, OpenTelemetry) that bridge both on-premises VMware and AWS VPCs."
    },
    {
      category: "Operations & Management",
      name: "Vendor Dependency & Lock-In",
      public: "High (Proprietary APIs like Aurora, DynamoDB, SQS)",
      private: "None (Open-source Linux, KVM, PostgreSQL)",
      hybrid: "Low-to-Medium (Docker containers run portability on both sides)",
      winner: "private",
      detail: "Containerized Kubernetes microservices in Hybrid cloud prevent locking into proprietary hyperscaler database engines."
    }
  ];

  // Radar dataset
  const radarData = [
    { subject: "Cost Efficiency", Public: 84, Private: 42, Hybrid: 86 },
    { subject: "Availability SLA", Public: 94, Private: 72, Hybrid: 96 },
    { subject: "Disaster Recovery", Public: 92, Private: 45, Hybrid: 95 },
    { subject: "Elastic Scalability", Public: 98, Private: 38, Hybrid: 90 },
    { subject: "Security & Sovereignty", Public: 78, Private: 96, Hybrid: 92 },
    { subject: "Operational Simplicity", Public: 85, Private: 40, Hybrid: 74 },
    { subject: "On-Demand Agility", Public: 96, Private: 35, Hybrid: 88 }
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <GitCompare className="w-4 h-4" />
            <span>Architectural Trade-Off Analysis</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Cloud Deployment Model Comparison Matrix</h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluating Public Cloud, Private Cloud, and Hybrid Cloud across 17 technical, operational, and financial dimensions.
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('recommendations')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all"
        >
          <span>Calculate Weighted Recommendation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Radar Comparison Chart & 3 Model Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Multi-Dimensional Capability Radar</h2>
            <p className="text-xs text-slate-400 mb-2">Comparing architecture strengths across 7 core pillars</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#475569' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <Radar name="Hybrid Cloud" dataKey="Hybrid" stroke="#10b981" fill="#10b981" fillOpacity={0.35} />
                  <Radar name="Public Cloud" dataKey="Public" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Radar name="Private Cloud" dataKey="Private" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <strong>Key Insight:</strong> Hybrid cloud achieves the highest aggregate surface area by combining private security with public recovery & elasticity.
          </div>
        </div>

        {/* 3 Model Overview Summary Cards (2 Cols) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Public Cloud Card */}
          <div
            onClick={() => setSelectedModel('public')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              selectedModel === 'public'
                ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20 shadow-md'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="text-2xl mb-2">🌐</div>
            <h3 className="font-bold text-slate-900 text-sm">Public Cloud</h3>
            <span className="text-[11px] font-medium text-blue-600 block mb-2">AWS / Azure / GCP</span>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Shared hyperscaler infrastructure. Pay only for consumed compute & storage.
            </p>
            <div className="space-y-1.5 text-[11px] pt-3 border-t border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Recovery (RTO):</span>
                <span className="font-mono font-bold text-emerald-600">2 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Elasticity:</span>
                <span className="font-semibold text-blue-600">Near-Infinite</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Upfront Capex:</span>
                <span className="font-mono text-emerald-600">Zero</span>
              </div>
            </div>
          </div>

          {/* Private Cloud Card */}
          <div
            onClick={() => setSelectedModel('private')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              selectedModel === 'private'
                ? 'border-purple-500 bg-purple-50/30 ring-2 ring-purple-500/20 shadow-md'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="text-2xl mb-2">🏢</div>
            <h3 className="font-bold text-slate-900 text-sm">Private Cloud</h3>
            <span className="text-[11px] font-medium text-purple-600 block mb-2">Dedicated On-Premises</span>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Owned hardware in company data centers. Full physical control, rigid capacity.
            </p>
            <div className="space-y-1.5 text-[11px] pt-3 border-t border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Recovery (RTO):</span>
                <span className="font-mono font-bold text-rose-600">48+ Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Elasticity:</span>
                <span className="font-semibold text-rose-600">None (Fixed)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Upfront Capex:</span>
                <span className="font-mono text-rose-600">Very High</span>
              </div>
            </div>
          </div>

          {/* Hybrid Cloud Card */}
          <div
            onClick={() => setSelectedModel('hybrid')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              selectedModel === 'hybrid'
                ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-md'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              Hybrid Cloud
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                Recommended
              </span>
            </h3>
            <span className="text-[11px] font-medium text-emerald-600 block mb-2">Private Core + Cloud DR</span>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Retains private core data while leveraging cloud for standby replication & bursting.
            </p>
            <div className="space-y-1.5 text-[11px] pt-3 border-t border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Recovery (RTO):</span>
                <span className="font-mono font-bold text-emerald-600">3.5 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Elasticity:</span>
                <span className="font-semibold text-emerald-600">High (Burst)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Run-Rate:</span>
                <span className="font-mono text-emerald-600">Optimized</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive 17-Criteria Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Comprehensive 17-Criteria Evaluation Matrix</h2>
            <p className="text-xs text-slate-500">Click any row to expand technical assumptions and calculation details</p>
          </div>
          <span className="text-xs font-mono text-slate-400">All figures illustrative estimates</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 w-1/4">Evaluation Criterion</th>
                <th className="px-6 py-3 w-1/4">Public Cloud</th>
                <th className="px-6 py-3 w-1/4">Private Cloud (On-Prem)</th>
                <th className="px-6 py-3 w-1/4 bg-emerald-50/50">Hybrid Cloud (Target)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARISON_ROWS.map((row, idx) => {
                const isExpanded = !!expandedCriteria[row.name];
                return (
                  <React.Fragment key={idx}>
                    <tr
                      onClick={() => toggleExpand(row.name)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{row.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium block ml-5">{row.category}</span>
                      </td>
                      <td className={`px-6 py-3.5 ${row.winner === 'public' ? 'text-indigo-700 font-semibold' : 'text-slate-600'}`}>
                        {row.public}
                      </td>
                      <td className={`px-6 py-3.5 ${row.winner === 'private' ? 'text-purple-700 font-semibold' : 'text-slate-600'}`}>
                        {row.private}
                      </td>
                      <td className={`px-6 py-3.5 bg-emerald-50/30 ${row.winner === 'hybrid' ? 'text-emerald-700 font-bold' : 'text-slate-700'}`}>
                        {row.hybrid}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={4} className="px-6 py-3 text-xs text-slate-600 leading-relaxed border-b border-slate-200">
                          <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-slate-200">
                            <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-800">Case Study Architecture Context:</strong> {row.detail}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
