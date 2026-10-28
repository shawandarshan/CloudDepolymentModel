import React, { useState, useEffect } from 'react';
import {
  Layers, HardDrive, Database, Server, Globe, Shield, Activity,
  Info, Download, RefreshCw, CheckCircle2, AlertTriangle, Cpu
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { api } from '../api/client';
import { ArchitectureLayout, ArchNode, ArchEdge } from '../types';

export const ArchitectureDesigner: React.FC = () => {
  const { selectedModel, setSelectedModel } = useSimulation();

  const [activeTemplate, setActiveTemplate] = useState<string>('hybrid_dr');
  const [layout, setLayout] = useState<ArchitectureLayout | null>(null);
  const [selectedNode, setSelectedNode] = useState<ArchNode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchArch = async (tmpl: string) => {
    setLoading(true);
    const data = await api.getArchitecture(tmpl);
    setLayout(data);
    setSelectedNode(data.nodes[0] || null);
    setLoading(false);
  };

  useEffect(() => {
    const tmpl = selectedModel === 'public' ? 'pure_public' : (selectedModel === 'private' ? 'traditional_onprem' : 'hybrid_dr');
    setActiveTemplate(tmpl);
    fetchArch(tmpl);
  }, [selectedModel]);

  const handleTemplateChange = (tmpl: string) => {
    setActiveTemplate(tmpl);
    if (tmpl === 'pure_public') setSelectedModel('public');
    else if (tmpl === 'traditional_onprem') setSelectedModel('private');
    else setSelectedModel('hybrid');
    fetchArch(tmpl);
  };

  const getNodeColor = (type: string, domain: string) => {
    if (domain === 'private') return 'border-purple-300 bg-purple-50/70 text-purple-900';
    if (domain === 'public') return 'border-blue-300 bg-blue-50/70 text-blue-900';
    return 'border-emerald-300 bg-emerald-50/70 text-emerald-900';
  };

  const exportSummary = () => {
    if (!layout) return;
    const content = `StreamCloud Intelligence Architecture Summary\n` +
      `Template: ${layout.template_name}\n` +
      `Model: ${layout.deployment_model.toUpperCase()}\n` +
      `Failure Domain: ${layout.failure_domain_description}\n\n` +
      `Components:\n` +
      layout.nodes.map(n => `- ${n.name} (${n.domain.toUpperCase()}) - Status: ${n.status}`).join('\n') +
      `\n\nConnections:\n` +
      layout.edges.map(e => `- ${e.from_node} -> ${e.to_node} [${e.label || 'Link'}]`).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture-summary-${activeTemplate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Interactive Infrastructure Topology</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Cloud Architecture & Failure Domain Designer</h1>
          <p className="text-xs text-slate-500 mt-1">
            Explore network boundaries, replication pathways, and failure isolation zones across baseline architectures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportSummary}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Spec
          </button>
        </div>
      </div>

      {/* 3 Predefined Architecture Templates Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => handleTemplateChange('traditional_onprem')}
          className={`p-3.5 text-left rounded-xl border transition-all ${
            activeTemplate === 'traditional_onprem'
              ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-600/20 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block mb-1">Template 1 (Baseline)</span>
          <div className="text-xs font-bold text-slate-900">Traditional On-Premises</div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            Single physical datacenter with single-point-of-failure database and tape backups.
          </p>
        </button>

        <button
          onClick={() => handleTemplateChange('pure_public')}
          className={`p-3.5 text-left rounded-xl border transition-all ${
            activeTemplate === 'pure_public'
              ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">Template 2 (Public)</span>
          <div className="text-xs font-bold text-slate-900">Hyperscale Cloud (Multi-AZ)</div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            AWS Aurora Multi-AZ, containerized auto-scaling, and global edge CDN delivery.
          </p>
        </button>

        <button
          onClick={() => handleTemplateChange('hybrid_dr')}
          className={`p-3.5 text-left rounded-xl border transition-all ${
            activeTemplate === 'hybrid_dr'
              ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">Template 3 (Recommended)</span>
          <div className="text-xs font-bold text-slate-900">Hybrid Cloud with DR Pilot Light</div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            Private core + asynchronous cloud standby database + S3 cold media tiering.
          </p>
        </button>
      </div>

      {/* Failure Domain Callout Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 text-xs flex items-start gap-3">
        <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-indigo-300">Failure Domain Assessment:</strong>{' '}
          <span className="text-slate-300">{layout?.failure_domain_description}</span>
        </div>
      </div>

      {/* Visual Canvas (2 Cols) & Node Properties Inspector (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topology Diagram Canvas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4 border-b border-slate-100 pb-2">
            <span className="font-semibold text-slate-700">Interactive Node Canvas (Click any component to inspect)</span>
            <span className="font-mono text-slate-400">{layout?.nodes.length} nodes | {layout?.edges.length} links</span>
          </div>

          {/* SVG Connection Lines & Interactive Component Cards */}
          <div className="relative min-h-[380px] bg-slate-50/60 rounded-xl border border-slate-200 p-4 overflow-x-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {layout?.nodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${getNodeColor(node.type, node.domain)}`}>
                        {node.domain}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {node.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs mb-1 truncate">{node.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono capitalize block">
                      Type: {node.type}
                    </span>

                    {/* Quick property preview */}
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-600 font-mono flex items-center justify-between">
                      <span>Click to view details</span>
                      <span>→</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Architecture Connections Legend */}
            <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-800 block mb-2">Interconnect & Dataflow Links:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                {layout?.edges.map(e => (
                  <div key={e.id} className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200">
                    <span className="text-indigo-600 font-semibold">{e.from_node}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-700">{e.to_node}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">[{e.label}]</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Node Properties Inspector (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-600" />
                Component Inspector
              </h3>
              <span className="text-xs font-mono font-bold text-indigo-600">{selectedNode?.id}</span>
            </div>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Component Name</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedNode.name}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[11px]">Domain</span>
                    <div className="font-semibold text-slate-800 capitalize mt-0.5">{selectedNode.domain}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Category</span>
                    <div className="font-semibold text-slate-800 capitalize mt-0.5">{selectedNode.type}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 text-[11px] block mb-2">Technical Properties & Specs:</span>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
                    {Object.entries(selectedNode.properties || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500 capitalize">{k.replace('_', ' ')}:</span>
                        <span className="font-bold text-slate-800 text-right">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                Select a component in the canvas to inspect its technical specifications.
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-snug">
            <strong>Architecture Recommendation:</strong> Hybrid cloud segregates sensitive subscriber billing into the private boundary, eliminating public cloud multi-tenancy risk while granting full cloud elasticity for media streaming.
          </div>
        </div>
      </div>
    </div>
  );
};
