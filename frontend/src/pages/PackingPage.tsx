import React, { useEffect, useState } from 'react';
import { Box, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { apiService } from '../api/client';
import type { PackingTask } from '../types';

export const PackingPage: React.FC = () => {
  const [tasks, setTasks] = useState<PackingTask[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      const res = await apiService.getPackingTasks();
      setTasks(res.tasks);
    } catch {
      console.error('Failed to load packing tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await apiService.completePacking(id);
      loadTasks();
    } catch {
      alert('Failed to complete packing');
    }
  };

  const handleReportDamaged = async (taskId: string) => {
    const sku = prompt('Enter SKU of damaged item:', 'SKU-102');
    if (!sku) return;
    try {
      await apiService.reportDamagedPacking(taskId, sku, 'Item damaged during packing');
      loadTasks();
      alert('Damaged item reported. Exception created for manager review.');
    } catch {
      alert('Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Packing Station Management
            <span className="badge bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30 text-[10px]">
              {tasks.length} Active Workstation Orders
            </span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Package verification, container selection, and weight audit before Quality Inspection
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-8 text-xs text-[var(--text-muted)]">Loading packing tasks...</div>
        ) : (
          tasks.map((t) => (
            <div key={t.task_id} className="card space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-base">{t.task_id}</span>
                    <span className="badge badge-info">{t.station}</span>
                    <span className={`badge ${t.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Order: <strong className="text-white">{t.order_id}</strong> ({t.customer_name})
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-[var(--text-muted)]">Packer:</span>
                  <div className="font-semibold text-white">{t.packer_name}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)]">
                <div>
                  <span className="text-[var(--text-muted)]">Package Type:</span>
                  <div className="font-bold text-white">{t.package_type}</div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Total Weight:</span>
                  <div className="font-bold text-emerald-400">{t.weight_kg} kg</div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Items to Pack:</span>
                <div className="divide-y divide-[var(--border-subtle)] border border-[var(--border)] rounded-lg overflow-hidden">
                  {t.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 text-xs flex justify-between bg-[var(--bg-secondary)]">
                      <span className="font-mono text-white">{item.sku} - {item.product_name}</span>
                      <span className="font-bold text-emerald-400">{item.quantity_ordered} units</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button onClick={() => handleReportDamaged(t.task_id)} className="btn-danger py-1 px-2.5 text-xs">
                  <AlertTriangle className="w-3 h-3" /> Report Damage
                </button>
                {t.status !== 'COMPLETED' && (
                  <button onClick={() => handleComplete(t.task_id)} className="btn-success py-1 px-3 text-xs">
                    <CheckCircle2 className="w-3 h-3" /> Mark Packed
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
