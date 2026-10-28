import React from 'react';
import {
  LayoutDashboard, GitCompare, ShieldAlert, Coins, TrendingUp,
  Layers, CheckSquare, FileText, Sliders, ChevronLeft, ChevronRight,
  Server, Cloud, ShieldCheck, Info
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { PageId } from '../../types';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
  { id: 'comparison', label: 'Cloud Model Comparison', icon: GitCompare },
  { id: 'dr-lab', label: 'Disaster Recovery Lab', icon: ShieldAlert, badge: 'CORE' },
  { id: 'cost-explorer', label: 'Cost Explorer & Forecast', icon: Coins },
  { id: 'scalability', label: 'Scalability Simulator', icon: TrendingUp },
  { id: 'architecture', label: 'Architecture Designer', icon: Layers },
  { id: 'recommendations', label: 'Risk & Recommendation', icon: CheckSquare },
  { id: 'reports', label: 'Reports & Export', icon: FileText },
  { id: 'settings', label: 'Settings & Demo Data', icon: Sliders }
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) => {
  const { currentPage, setCurrentPage, selectedModel } = useSimulation();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-200 transition-all duration-300 ease-in-out border-r border-slate-800 ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  StreamCloud <span className="text-[10px] font-semibold uppercase bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">Intelligence</span>
                </span>
                <span className="text-[11px] text-slate-400 tracking-wide">
                  Simulate. Compare. Optimize.
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Current Active Model Pill */}
        {!isCollapsed && (
          <div className="mx-4 mt-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Active Model</span>
              <span className="capitalize font-semibold text-indigo-400 flex items-center gap-1">
                {selectedModel === 'hybrid' && '⚡ Hybrid Cloud'}
                {selectedModel === 'public' && '🌐 Public Cloud'}
                {selectedModel === 'private' && '🏢 Private Cloud'}
              </span>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Academic Simulation Environment Banner at bottom */}
        {!isCollapsed ? (
          <div className="p-4 border-t border-slate-800">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200 block mb-0.5">Academic Case Study</span>
                Illustrative simulation environment. Values & recovery estimates are modeled for demonstration.
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-slate-800 flex justify-center" title="Academic Case Study Simulator">
            <Info className="w-4 h-4 text-indigo-400" />
          </div>
        )}
      </aside>
    </>
  );
};
