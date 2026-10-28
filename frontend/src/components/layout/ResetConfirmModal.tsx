import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden transform transition-all">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5 text-rose-600 font-semibold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>Reset Simulation Baseline</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to reset the simulation state? This will:
          </p>
          <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside bg-slate-50 p-3 rounded-lg border border-slate-100">
            <li>Reset all active simulated incidents and topology health</li>
            <li>Restore deterministic baseline values for 25,000 viewers & 12 TB storage</li>
            <li>Clear local incident history and reload default case study crisis</li>
            <li>Return currency and decision weights to defaults (INR ₹ / Hybrid focus)</li>
          </ul>
          <p className="text-xs text-amber-600 font-medium pt-1">
            ⚠️ This action is safe for demo resetting and will not delete application code.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
          >
            Reset Everything
          </button>
        </div>
      </div>
    </div>
  );
};
