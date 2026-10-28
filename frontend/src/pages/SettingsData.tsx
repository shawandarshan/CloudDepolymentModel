import React, { useState } from 'react';
import {
  Sliders, Save, RefreshCw, Upload, Download, CheckCircle2,
  AlertTriangle, DollarSign, Clock, ShieldCheck, Database
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { UserConfig } from '../types';

export const SettingsData: React.FC = () => {
  const { userConfig, updateUserConfig, resetAllDemoData, isBackendOnline } = useSimulation();

  const [formData, setFormData] = useState<UserConfig>(userConfig);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserConfig(formData);
    setSaveStatus('Settings successfully saved and persisted to database!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const exportConfigJSON = () => {
    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streamcloud-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.company_name && parsed.currency) {
          setFormData(parsed);
          await updateUserConfig(parsed);
          setSaveStatus('Scenario configuration imported successfully.');
        } else {
          alert('Invalid scenario file format.');
        }
      } catch (err) {
        alert('Malformed JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Simulation Governance & Data</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Environment Settings & Scenario Data</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure currency units, RTO/RPO SLA thresholds, and import/export reproducible demonstration scenarios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Scenario</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
          <button
            onClick={exportConfigJSON}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Scenario</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {saveStatus}
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Section 1: Enterprise Profile */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            Enterprise Profile & Currency
          </h2>
          <p className="text-xs text-slate-500 mb-4">Set your case study company title and primary display currency.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">Company Name</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">Currency (Default: INR ₹)</label>
              <select
                value={formData.currency}
                onChange={e => {
                  const curr = e.target.value;
                  const sym = curr === 'INR' ? '₹' : (curr === 'USD' ? '$' : (curr === 'EUR' ? '€' : '£'));
                  setFormData({ ...formData, currency: curr, currency_symbol: sym });
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="INR">Indian Rupee (INR - ₹)</option>
                <option value="USD">US Dollar (USD - $)</option>
                <option value="EUR">Euro (EUR - €)</option>
                <option value="GBP">British Pound (GBP - £)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: SLA & Disaster Recovery Targets */}
        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Disaster Recovery SLA Thresholds
          </h2>
          <p className="text-xs text-slate-500 mb-4">Define targets for breach detection in the Disaster Recovery Lab.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">RTO Target (Minutes)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.rto_target_minutes}
                onChange={e => setFormData({ ...formData, rto_target_minutes: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Maximum allowed recovery downtime</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">RPO Target (Minutes)</label>
              <input
                type="number"
                min="0.5"
                max="120"
                step="0.5"
                value={formData.rpo_target_minutes}
                onChange={e => setFormData({ ...formData, rpo_target_minutes: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Maximum acceptable data loss window</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">Backup Frequency (Hours)</label>
              <input
                type="number"
                min="1"
                max="48"
                value={formData.backup_frequency_hours}
                onChange={e => setFormData({ ...formData, backup_frequency_hours: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">Replication Lag (Seconds)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.replication_lag_seconds}
                onChange={e => setFormData({ ...formData, replication_lag_seconds: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Connection Status & State */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isBackendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-slate-600">
              Storage Engine:{' '}
              <strong>{isBackendOnline ? 'FastAPI + SQLite Database' : 'Client-Side LocalStorage'}</strong>
            </span>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
