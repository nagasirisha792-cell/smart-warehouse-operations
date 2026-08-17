import React, { useState } from 'react';
import { X, Zap, AlertTriangle, ArrowRight, Play, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiService } from '../../api/client';
import type { SimulationResult } from '../../types';

interface SimulationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);

  if (!isOpen) return null;

  const handleSimulateShortage = async () => {
    setLoading(true);
    try {
      const res = await apiService.simulateStockShortage('SKU-104', 20);
      setLastResult(res);
      onRefreshData();
    } catch {
      alert('Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateUrgentOrder = async () => {
    setLoading(true);
    try {
      const res = await apiService.simulateUrgentOrder('Apex Manufacturing Co.', 'SKU-106', 8);
      setLastResult(res);
      onRefreshData();
    } catch {
      alert('Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDamage = async () => {
    setLoading(true);
    try {
      const res = await apiService.simulateDamagedItem('SKU-102', 3, 'ORD-1004');
      setLastResult(res);
      onRefreshData();
    } catch {
      alert('Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDelay = async () => {
    setLoading(true);
    try {
      const res = await apiService.simulateDelayOrder('ORD-1002');
      setLastResult(res);
      onRefreshData();
    } catch {
      alert('Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-xl animate-fade-in">
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Warehouse Simulation Mode</h3>
              <p className="text-xs text-[var(--text-muted)]">Test Decision Engine Reactions to Real-time Events</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="modal-body space-y-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
            <strong>Hackathon Judge Demo:</strong> Trigger real-time operational disruptions and watch how WareMind AI re-evaluates allocations, prioritizes orders, and creates automated recommendations.
          </div>

          {/* Simulation Event Triggers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleSimulateShortage}
              disabled={loading}
              className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-amber-500/50 text-left transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Simulate Stock Shortage
                </span>
                <Play className="w-3 h-3 text-[var(--text-muted)] group-hover:text-amber-400" />
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Reduces SKU-104 stock by 20 units. Triggers priority re-allocation cascade.
              </p>
            </button>

            <button
              onClick={handleSimulateUrgentOrder}
              disabled={loading}
              className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-blue-500/50 text-left transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <Zap className="w-3.5 h-3.5" />
                  Inject CRITICAL Order
                </span>
                <Play className="w-3 h-3 text-[var(--text-muted)] group-hover:text-blue-400" />
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Injects high-value overnight order. Priority score recalculates to 95.
              </p>
            </button>

            <button
              onClick={handleSimulateDamage}
              disabled={loading}
              className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-red-500/50 text-left transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                <span className="flex items-center gap-1.5 text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Report Item Damage
                </span>
                <Play className="w-3 h-3 text-[var(--text-muted)] group-hover:text-red-400" />
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Marks 3 units of SKU-102 damaged in QC. Triggers auto-exception.
              </p>
            </button>

            <button
              onClick={handleSimulateDelay}
              disabled={loading}
              className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-orange-500/50 text-left transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                <span className="flex items-center gap-1.5 text-orange-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Simulate Picking Delay
                </span>
                <Play className="w-3 h-3 text-[var(--text-muted)] group-hover:text-orange-400" />
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Delays picking for ORD-1002. Elevates risk level to HIGH.
              </p>
            </button>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="p-4 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Running decision engines and updating system state...</span>
            </div>
          )}

          {/* System Response Output */}
          {lastResult && (
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-emerald-500/30 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Engine Reaction: {lastResult.simulation}</span>
              </div>
              <p className="text-xs text-white leading-relaxed font-mono bg-[var(--bg-primary)] p-2.5 rounded-lg border border-[var(--border)]">
                {lastResult.system_response}
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Close Simulation
          </button>
        </div>
      </div>
    </div>
  );
};
