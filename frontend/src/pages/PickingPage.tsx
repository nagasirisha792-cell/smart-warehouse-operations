import React, { useEffect, useState } from 'react';
import { PackageCheck, Play, CheckCircle2, AlertTriangle, Navigation, Clock } from 'lucide-react';
import { apiService } from '../api/client';
import type { PickingTask } from '../types';

export const PickingPage: React.FC = () => {
  const [tasks, setTasks] = useState<PickingTask[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      const res = await apiService.getPickingTasks();
      setTasks(res.tasks);
    } catch {
      console.error('Failed to load picking tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleStart = async (id: string) => {
    try {
      await apiService.startPicking(id);
      loadTasks();
    } catch {
      alert('Failed to start picking');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await apiService.completePicking(id);
      loadTasks();
    } catch {
      alert('Failed to complete picking');
    }
  };

  const handleBlock = async (id: string) => {
    const reason = prompt('Enter block reason (e.g. Item missing at bin):', 'Item not found in bin A2-07');
    if (!reason) return;
    try {
      await apiService.blockPicking(id, reason);
      loadTasks();
    } catch {
      alert('Failed to block picking');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Picking Operations & Route Optimization
            <span className="badge bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30 text-[10px]">
              {tasks.length} Tasks
            </span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Zone-grouped pick routes reducing picker travel distance by up to 35%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-8 text-xs text-[var(--text-muted)]">Loading picking tasks...</div>
        ) : (
          tasks.map((t) => (
            <div key={t.task_id} className="card space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-base">{t.task_id}</span>
                    <span className={`badge ${
                      t.priority === 'CRITICAL' ? 'badge-critical' :
                      t.priority === 'HIGH' ? 'badge-high' : 'badge-medium'
                    }`}>
                      {t.priority}
                    </span>
                    <span className={`badge ${
                      t.status === 'COMPLETED' ? 'badge-success' :
                      t.status === 'PICKING' ? 'badge-info' :
                      t.status === 'BLOCKED' ? 'badge-critical' : 'badge-low'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Order: <strong className="text-white">{t.order_id}</strong> ({t.customer_name})
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-[var(--text-muted)]">Picker:</span>
                  <div className="font-semibold text-white">{t.picker_name}</div>
                </div>
              </div>

              {/* Optimized Route Box */}
              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>AI Optimized Pick Route</span>
                </div>
                <div className="font-mono text-white font-bold">{t.optimized_route}</div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Est. Time: {t.estimated_time_min} mins {t.actual_time_min ? `(Actual: ${t.actual_time_min} mins)` : ''}
                </div>
              </div>

              {t.blocked_reason && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 font-medium">
                  🚨 BLOCKED: {t.blocked_reason}
                </div>
              )}

              {/* Items List */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Items to Pick:</span>
                <div className="divide-y divide-[var(--border-subtle)] border border-[var(--border)] rounded-lg overflow-hidden">
                  {t.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 text-xs flex justify-between bg-[var(--bg-elevated)]">
                      <span className="font-mono text-white font-semibold">{item.sku} - {item.product_name}</span>
                      <span className="font-bold text-emerald-400">{item.quantity_ordered} units</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                {t.status === 'WAITING' && (
                  <button onClick={() => handleStart(t.task_id)} className="btn-primary py-1 px-3 text-xs">
                    <Play className="w-3 h-3" /> Start Picking
                  </button>
                )}
                {t.status === 'PICKING' && (
                  <button onClick={() => handleComplete(t.task_id)} className="btn-success py-1 px-3 text-xs">
                    <CheckCircle2 className="w-3 h-3" /> Complete Pick
                  </button>
                )}
                {t.status !== 'COMPLETED' && t.status !== 'BLOCKED' && (
                  <button onClick={() => handleBlock(t.task_id)} className="btn-danger py-1 px-2.5 text-xs">
                    <AlertTriangle className="w-3 h-3" /> Report Block
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
