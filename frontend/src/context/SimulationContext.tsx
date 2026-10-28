import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  DeploymentModelId, PageId, UserConfig, SimulationResultOutput, AlertNotification
} from '../types';
import { api } from '../api/client';
import { DEFAULT_USER_CONFIG } from '../services/localSimulation';

interface SimulationContextType {
  selectedModel: DeploymentModelId;
  setSelectedModel: (m: DeploymentModelId) => void;
  currentPage: PageId;
  setCurrentPage: (p: PageId) => void;
  userConfig: UserConfig;
  updateUserConfig: (cfg: Partial<UserConfig>) => Promise<void>;
  activeIncident: SimulationResultOutput | null;
  incidentHistory: SimulationResultOutput[];
  isSimulating: boolean;
  simulationProgress: number;
  triggerScenario: (scenarioType: string, recoveryConfig: string) => Promise<SimulationResultOutput>;
  resolveCurrentIncident: () => void;
  alerts: AlertNotification[];
  markAlertsRead: () => void;
  resetAllDemoData: () => Promise<void>;
  isBackendOnline: boolean;
  activeUsers: number;
  setActiveUsers: (u: number) => void;
  storageTb: number;
  setStorageTb: (s: number) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedModel, setSelectedModel] = useState<DeploymentModelId>('hybrid');
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [userConfig, setUserConfig] = useState<UserConfig>(DEFAULT_USER_CONFIG);
  const [activeIncident, setActiveIncident] = useState<SimulationResultOutput | null>(null);
  const [incidentHistory, setIncidentHistory] = useState<SimulationResultOutput[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [activeUsers, setActiveUsers] = useState<number>(25000);
  const [storageTb, setStorageTb] = useState<number>(12.0);

  const [alerts, setAlerts] = useState<AlertNotification[]>([
    {
      id: 'alt-1',
      title: 'Historical Reference Loaded',
      message: 'Case Study: 54-hour database outage under on-premises private datacenter loaded.',
      severity: 'warn',
      timestamp: '10m ago',
      read: false
    },
    {
      id: 'alt-2',
      title: 'Hybrid Architecture Ready',
      message: 'Cloud Standby DB (AWS) connected to Private Core via Direct Connect.',
      severity: 'ok',
      timestamp: '5m ago',
      read: false
    }
  ]);

  // Initial health check & config load
  useEffect(() => {
    async function init() {
      const online = await api.checkHealth();
      setIsBackendOnline(online);
      const cfg = await api.getConfig();
      setUserConfig(cfg);

      // Load saved incidents from localStorage
      const savedHistory = localStorage.getItem('streamcloud_incidents');
      if (savedHistory) {
        try {
          setIncidentHistory(JSON.parse(savedHistory));
        } catch (e) {}
      }
    }
    init();
  }, []);

  const updateUserConfig = async (partial: Partial<UserConfig>) => {
    const next = { ...userConfig, ...partial };
    setUserConfig(next);
    await api.saveConfig(next);
  };

  const triggerScenario = async (scenarioType: string, recoveryConfig: string): Promise<SimulationResultOutput> => {
    setIsSimulating(true);
    setSimulationProgress(15);

    const result = await api.runSimulation({
      scenario_type: scenarioType,
      deployment_model: selectedModel,
      recovery_config: recoveryConfig,
      active_users: activeUsers,
      rto_target_minutes: userConfig.rto_target_minutes,
      rpo_target_minutes: userConfig.rpo_target_minutes,
      backup_frequency_hours: userConfig.backup_frequency_hours,
      replication_lag_seconds: userConfig.replication_lag_seconds
    });

    // Simulate animated progress
    const timer = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsSimulating(false);
          return 100;
        }
        return prev + 25;
      });
    }, 250);

    setActiveIncident(result);
    const updatedHistory = [result, ...incidentHistory.slice(0, 19)];
    setIncidentHistory(updatedHistory);
    localStorage.setItem('streamcloud_incidents', JSON.stringify(updatedHistory));

    // Append notification alert
    const newAlert: AlertNotification = {
      id: `alt-${Date.now()}`,
      title: result.title,
      message: `Simulated RTO: ${result.simulated_rto_minutes}m. Status: ${result.rto_breached ? 'RTO BREACHED' : 'Within Target'}.`,
      severity: result.rto_breached ? 'err' : 'info',
      timestamp: 'Just now',
      read: false
    };
    setAlerts(prev => [newAlert, ...prev]);

    return result;
  };

  const resolveCurrentIncident = () => {
    setActiveIncident(null);
    setSimulationProgress(0);
    setIsSimulating(false);
  };

  const markAlertsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  const resetAllDemoData = async () => {
    localStorage.removeItem('streamcloud_incidents');
    localStorage.removeItem('streamcloud_user_config');
    setUserConfig(DEFAULT_USER_CONFIG);
    setSelectedModel('hybrid');
    setActiveIncident(null);
    setIncidentHistory([]);
    setSimulationProgress(0);
    setIsSimulating(false);
    setActiveUsers(25000);
    setStorageTb(12.0);
    setAlerts([
      {
        id: 'alt-reset',
        title: 'Demo Environment Reset',
        message: 'All parameters, telemetry, and topology restored to clean baseline state.',
        severity: 'info',
        timestamp: 'Just now',
        read: false
      }
    ]);
  };

  return (
    <SimulationContext.Provider
      value={{
        selectedModel,
        setSelectedModel,
        currentPage,
        setCurrentPage,
        userConfig,
        updateUserConfig,
        activeIncident,
        incidentHistory,
        isSimulating,
        simulationProgress,
        triggerScenario,
        resolveCurrentIncident,
        alerts,
        markAlertsRead,
        resetAllDemoData,
        isBackendOnline,
        activeUsers,
        setActiveUsers,
        storageTb,
        setStorageTb
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
