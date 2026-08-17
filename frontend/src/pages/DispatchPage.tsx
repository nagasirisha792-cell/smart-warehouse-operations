import React, { useEffect, useState } from 'react';
import { Truck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { apiService } from '../api/client';
import type { Dispatch } from '../types';

export const DispatchPage: React.FC = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDispatches = async () => {
    try {
      const res = await apiService.getDispatches();
      setDispatches(res.dispatches);
    } catch {
      console.error('Failed to load dispatches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, []);

  const handleMarkDispatched = async (id: string) => {
    try {
      await apiService.markDispatched(id);
      loadDispatches();
    } catch {
      alert('Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Carrier Dispatch & Tracking Hub
            <span className="badge bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 text-[10px]">
              {dispatches.length} Shipments
            </span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time carrier dispatch scheduling and delivery SLA risk monitoring
          </p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Dispatch ID</th>
              <th>Order ID / Customer</th>
              <th>Carrier</th>
              <th>Tracking Number</th>
              <th>Packages / Weight</th>
              <th>Status</th>
              <th>Expected Delivery</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-xs text-[var(--text-muted)]">Loading dispatches...</td>
              </tr>
            ) : (
              dispatches.map((d) => (
                <tr key={d.dispatch_id}>
                  <td className="font-mono font-bold text-white">{d.dispatch_id}</td>
                  <td>
                    <div className="font-bold text-white font-mono">{d.order_id}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{d.customer_name}</div>
                  </td>
                  <td className="font-semibold text-blue-400">{d.carrier}</td>
                  <td className="font-mono text-xs text-white">{d.tracking_number}</td>
                  <td>{d.package_count} pkgs ({d.weight_kg} kg)</td>
                  <td>
                    <span className={`badge ${
                      d.status === 'DELIVERED' ? 'badge-success' :
                      d.status === 'DISPATCHED' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="text-xs text-amber-400 font-mono">
                    {new Date(d.expected_delivery).toLocaleDateString()}
                  </td>
                  <td>
                    {d.status === 'READY' && (
                      <button onClick={() => handleMarkDispatched(d.dispatch_id)} className="btn-success py-1 px-3 text-xs">
                        <Truck className="w-3 h-3" /> Mark Dispatched
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
