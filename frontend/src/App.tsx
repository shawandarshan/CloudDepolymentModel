import React, { useState } from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ResetConfirmModal } from './components/layout/ResetConfirmModal';

// Pages
import { OverviewDashboard } from './pages/OverviewDashboard';
import { CloudModelComparison } from './pages/CloudModelComparison';
import { DisasterRecoveryLab } from './pages/DisasterRecoveryLab';
import { CostExplorer } from './pages/CostExplorer';
import { ScalabilitySimulator } from './pages/ScalabilitySimulator';
import { ArchitectureDesigner } from './pages/ArchitectureDesigner';
import { RiskRecommendationCenter } from './pages/RiskRecommendationCenter';
import { ReportsExport } from './pages/ReportsExport';
import { SettingsData } from './pages/SettingsData';

const AppContent: React.FC = () => {
  const { currentPage, resetAllDemoData } = useSimulation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const renderActivePage = () => {
    switch (currentPage) {
      case 'overview': return <OverviewDashboard />;
      case 'comparison': return <CloudModelComparison />;
      case 'dr-lab': return <DisasterRecoveryLab />;
      case 'cost-explorer': return <CostExplorer />;
      case 'scalability': return <ScalabilitySimulator />;
      case 'architecture': return <ArchitectureDesigner />;
      case 'recommendations': return <RiskRecommendationCenter />;
      case 'reports': return <ReportsExport />;
      case 'settings': return <SettingsData />;
      default: return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onOpenReset={() => setIsResetModalOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Reset Demo Modal */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={resetAllDemoData}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SimulationProvider>
      <AppContent />
    </SimulationProvider>
  );
};

export default App;
