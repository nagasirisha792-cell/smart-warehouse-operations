import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Boxes, RefreshCw, AlertTriangle, TrendingUp, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { apiService } from '../api/client';

export const InventoryDetailPage: React.FC = () => {
  const { sku } = useParams<{ sku: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('Stock replenishment');

  const loadItem = async () => {
    if (!sku) return;
    try {
      const res = await apiService.getInventoryItem(sku);
      setData(res);
    } catch {
      console.error('Failed to load item detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItem();
  }, [sku]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-[var(--text-muted)]">
        Loading inventory details...
      </div>
    );
  }

  const rec = data.replenishment_recommendation;

  const handleAdjust = async (delta: number) => {
    try {
      await apiService.adjustInventory(data.sku, delta, adjustReason);
      loadItem();
      alert(`Inventory adjusted by ${delta > 0 ? '+' : ''}${delta} units`);
    } catch {
      alert('Failed to adjust inventory');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/inventory')} className="btn-ghost text-xs">
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </button>
      </div>

      {/* Main Header Card */}
      <div className="card p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white font-mono">{data.sku}</h1>
              <span className={`badge ${
                data.status === 'HEALTHY' ? 'badge-success' :
                data.status === 'LOW_STOCK' ? 'badge-warning' :
                data.status === 'CRITICAL' ? 'badge-critical' : 'badge-critical'
              }`}>
                {data.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">{data.product_name}</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Category: {data.category} • Zone: {data.zone} • Bin: {data.bin_location}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => handleAdjust(adjustQty)} className="btn-success text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Stock (+{adjustQty})
            </button>
            <button onClick={() => handleAdjust(-adjustQty)} className="btn-danger text-xs">
              <Minus className="w-3.5 h-3.5" /> Remove Stock (-{adjustQty})
            </button>
          </div>
        </div>

        {/* Stock Breakdown Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs space-y-1">
            <span className="text-[var(--text-muted)] font-semibold uppercase">Available Stock</span>
            <div className="text-2xl font-extrabold text-white">{data.quantity_available} units</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs space-y-1">
            <span className="text-[var(--text-muted)] font-semibold uppercase">Reserved Stock</span>
            <div className="text-2xl font-extrabold text-amber-400">{data.quantity_reserved} units</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs space-y-1">
            <span className="text-[var(--text-muted)] font-semibold uppercase">Reorder Level</span>
            <div className="text-2xl font-extrabold text-blue-400">{data.reorder_level} units</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs space-y-1">
            <span className="text-[var(--text-muted)] font-semibold uppercase">Avg Daily Demand</span>
            <div className="text-2xl font-extrabold text-emerald-400">{data.avg_daily_demand} / day</div>
          </div>
        </div>

        {/* AI Replenishment Recommendation Banner */}
        {rec && rec.should_reorder && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>AI Replenishment Recommendation</span>
            </div>
            <p className="text-white font-bold text-sm">
              Reorder {rec.recommended_quantity} units immediately (Estimated Cost: ${rec.estimated_cost?.toLocaleString()})
            </p>
            <p className="text-amber-200/90">{rec.reason}</p>
          </div>
        )}

        {/* Stock Movement Audit Log */}
        <div>
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Recent Stock Movements</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Movement Type</th>
                  <th>Quantity</th>
                  <th>Order Reference</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {data.movements?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-xs text-[var(--text-muted)]">No recent movements</td>
                  </tr>
                ) : (
                  data.movements?.map((m: any, i: number) => (
                    <tr key={i}>
                      <td className="text-xs text-white">{new Date(m.timestamp).toLocaleString()}</td>
                      <td><span className="badge badge-info">{m.movement_type}</span></td>
                      <td className={`font-bold ${m.quantity > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="font-mono text-xs text-white">{m.order_id || '-'}</td>
                      <td className="text-xs text-[var(--text-secondary)]">{m.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
