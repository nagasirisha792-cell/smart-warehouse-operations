import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  HelpCircle,
  Layers,
  AlertTriangle,
  Play,
  UserCheck,
  Building,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { apiService } from '../api/client';
import type { Order } from '../types';
import { WhyThisDecisionModal } from '../components/ui/WhyThisDecisionModal';
import { AllocationDecisionModal } from '../components/ui/AllocationDecisionModal';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const [showWhyModal, setShowWhyModal] = useState(false);
  const [allocationModalData, setAllocationModalData] = useState<any>(null);

  const loadOrder = async () => {
    if (!id) return;
    try {
      const res = await apiService.getOrder(id);
      setOrder(res);
    } catch {
      console.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  if (loading || !order) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-[var(--text-muted)]">
        Loading order detail...
      </div>
    );
  }

  const handleRunPrioritization = async () => {
    try {
      const res = await apiService.prioritizeOrder(order.order_id);
      loadOrder();
      alert(`Priority updated to ${res.priority} (Score: ${res.priority_score})`);
    } catch {
      alert('Failed');
    }
  };

  const handleRunAllocation = async () => {
    try {
      const res = await apiService.allocateOrder(order.order_id);
      setAllocationModalData(res);
      loadOrder();
    } catch {
      alert('Allocation failed');
    }
  };

  const handleAdvanceStage = async () => {
    try {
      await apiService.advanceOrder(order.order_id);
      loadOrder();
    } catch {
      alert('Cannot advance order stage further');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/orders')} className="btn-ghost text-xs">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleRunPrioritization} className="btn-secondary text-xs">
            Recalculate Priority
          </button>
          <button onClick={handleRunAllocation} className="btn-secondary text-xs">
            Run Allocation Engine
          </button>
          <button onClick={handleAdvanceStage} className="btn-primary text-xs">
            Advance Stage →
          </button>
        </div>
      </div>

      {/* Main Order Card */}
      <div className="card p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white font-mono">{order.order_id}</h1>
              <span className={`badge ${
                order.priority === 'CRITICAL' ? 'badge-critical' :
                order.priority === 'HIGH' ? 'badge-high' : 'badge-medium'
              }`}>
                {order.priority} (Score: {order.priority_score})
              </span>
              <span className="badge badge-info">{order.status}</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Created on {new Date(order.created_at).toLocaleString()} • SLA Target: {new Date(order.sla_deadline).toLocaleString()}
            </p>
          </div>

          <button
            onClick={() => setShowWhyModal(true)}
            className="btn-secondary text-xs border-blue-500/30 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
            Why this decision?
          </button>
        </div>

        {/* 8-Stage Timeline */}
        <div>
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">
            Fulfillment Lifecycle Timeline
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {order.timeline.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-center space-y-1 ${
                  step.status === 'COMPLETED' ? 'bg-emerald-950/20 border-emerald-500/30' :
                  step.status === 'IN_PROGRESS' ? 'bg-blue-950/30 border-blue-500/40 animate-pulse' :
                  'bg-[var(--bg-secondary)] border-[var(--border)] opacity-50'
                }`}
              >
                <div className="flex justify-center mb-1">
                  {step.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : step.status === 'IN_PROGRESS' ? (
                    <Clock className="w-4 h-4 text-blue-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[var(--text-muted)]" />
                  )}
                </div>
                <div className="text-[11px] font-bold text-white leading-tight">{step.label}</div>
                <div className="text-[9px] text-[var(--text-muted)]">{step.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details & Customer Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2 text-xs">
            <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Customer Info</span>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Name:</span> <span className="text-white font-semibold">{order.customer_name}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Tier:</span> <span className="text-blue-400 font-bold">{order.customer_tier}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Shipping:</span> <span className="text-white font-semibold">{order.shipping_method}</span></div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2 text-xs">
            <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Fulfillment Status</span>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Allocation:</span> <span className="badge badge-success">{order.allocation_status}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Risk Level:</span> <span className="badge badge-critical">{order.risk_level}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Assigned Picker:</span> <span className="text-white font-semibold">{order.assigned_picker}</span></div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2 text-xs">
            <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Financial & SLA</span>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Total Value:</span> <span className="text-emerald-400 font-bold text-sm">${order.total_value.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Items Count:</span> <span className="text-white font-semibold">{order.total_quantity} units</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Notes:</span> <span className="text-amber-300 font-semibold">{order.notes || 'None'}</span></div>
          </div>
        </div>

        {/* Order Items Table */}
        <div>
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Order Items Breakdown</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Quantity Ordered</th>
                  <th>Unit Price</th>
                  <th>Total Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-mono font-bold text-white">{item.sku}</td>
                    <td className="text-white">{item.product_name}</td>
                    <td className="font-bold text-white">{item.quantity_ordered}</td>
                    <td>${item.unit_price.toFixed(2)}</td>
                    <td className="font-bold text-emerald-400">${(item.quantity_ordered * item.unit_price).toFixed(2)}</td>
                    <td><span className="badge badge-success">ALLOCATED</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <WhyThisDecisionModal
        order={order}
        onClose={() => setShowWhyModal(false)}
      />

      <AllocationDecisionModal
        data={allocationModalData}
        onClose={() => setAllocationModalData(null)}
      />
    </div>
  );
};
