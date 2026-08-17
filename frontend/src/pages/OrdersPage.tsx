import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  HelpCircle,
  Layers,
  Eye,
  ShoppingBag,
} from 'lucide-react';
import { apiService } from '../api/client';
import type { Order } from '../types';
import { WhyThisDecisionModal } from '../components/ui/WhyThisDecisionModal';
import { AllocationDecisionModal } from '../components/ui/AllocationDecisionModal';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const [selectedOrderForWhy, setSelectedOrderForWhy] = useState<Order | null>(null);
  const [allocationModalData, setAllocationModalData] = useState<any>(null);

  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const params: Record<string, string> = {};
      if (priorityFilter) params.priority = priorityFilter;
      if (statusFilter) params.status = statusFilter;
      if (riskFilter) params.risk = riskFilter;
      if (search) params.search = search;

      const res = await apiService.getOrders(params);
      setOrders(res.orders);
    } catch {
      console.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [priorityFilter, statusFilter, riskFilter, search]);

  const handleAllocate = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiService.allocateOrder(orderId);
      setAllocationModalData(res);
      fetchOrders();
    } catch {
      alert('Allocation engine failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
            Order Fulfillment Center
            <span className="badge bg-blue-500/20 text-blue-400 font-extrabold border border-blue-500/30 text-[10px]">
              {orders.length} Active Orders
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized and allocated automatically by WareMind Decision Intelligence Engine
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3 bg-[#0f1523]/90">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order ID (ORD-1001), customer name, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-10 py-2 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="select text-xs py-2"
          >
            <option value="" className="bg-[#0f1523]">All Priorities</option>
            <option value="CRITICAL" className="bg-[#0f1523]">CRITICAL</option>
            <option value="HIGH" className="bg-[#0f1523]">HIGH</option>
            <option value="MEDIUM" className="bg-[#0f1523]">MEDIUM</option>
            <option value="LOW" className="bg-[#0f1523]">LOW</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select text-xs py-2"
          >
            <option value="" className="bg-[#0f1523]">All Statuses</option>
            <option value="PENDING" className="bg-[#0f1523]">PENDING</option>
            <option value="PICKING" className="bg-[#0f1523]">PICKING</option>
            <option value="PACKING" className="bg-[#0f1523]">PACKING</option>
            <option value="QC" className="bg-[#0f1523]">QC</option>
            <option value="DISPATCHED" className="bg-[#0f1523]">DISPATCHED</option>
            <option value="DELIVERED" className="bg-[#0f1523]">DELIVERED</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="select text-xs py-2"
          >
            <option value="" className="bg-[#0f1523]">All Risk Levels</option>
            <option value="HIGH" className="bg-[#0f1523]">HIGH Risk</option>
            <option value="MEDIUM" className="bg-[#0f1523]">MEDIUM Risk</option>
            <option value="LOW" className="bg-[#0f1523]">LOW Risk</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-wrapper shadow-2xl">
        <table className="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Priority & Score</th>
              <th>Status</th>
              <th>Allocation</th>
              <th>Risk</th>
              <th>Assigned Picker</th>
              <th>SLA Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-xs text-slate-400">
                  Running decision engines...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-xs text-slate-400">
                  No orders match current filters.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr
                  key={o.order_id}
                  onClick={() => navigate(`/orders/${o.order_id}`)}
                  className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                >
                  <td className="font-mono font-extrabold text-white">
                    {o.order_id}
                    <div className="text-[10px] text-slate-400 font-sans font-medium">
                      {o.items.length} items (${o.total_value.toLocaleString()})
                    </div>
                  </td>

                  <td>
                    <div className="font-bold text-white text-xs">{o.customer_name}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{o.customer_tier} Tier</div>
                  </td>

                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${
                        o.priority === 'CRITICAL' ? 'badge-critical' :
                        o.priority === 'HIGH' ? 'badge-high' :
                        o.priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                      }`}>
                        {o.priority}
                      </span>
                      <span className="font-mono text-xs font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        {o.priority_score}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderForWhy(o);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-500/20 transition-all"
                        title="Why this decision?"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  <td>
                    <span className="badge badge-info">
                      {o.status}
                    </span>
                  </td>

                  <td>
                    <span className={`badge ${
                      o.allocation_status === 'FULLY_ALLOCATED' ? 'badge-success' :
                      o.allocation_status === 'PARTIALLY_ALLOCATED' ? 'badge-warning' :
                      o.allocation_status === 'BACKORDER' ? 'badge-critical' : 'badge-low'
                    }`}>
                      {o.allocation_status.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td>
                    <span className={`badge ${
                      o.risk_level === 'HIGH' ? 'badge-critical' :
                      o.risk_level === 'MEDIUM' ? 'badge-warning' : 'badge-success'
                    }`}>
                      {o.risk_level}
                    </span>
                  </td>

                  <td className="text-xs text-slate-200 font-medium">
                    {o.assigned_picker || 'Unassigned'}
                  </td>

                  <td className="text-xs font-mono">
                    <span className={new Date(o.sla_deadline) < new Date() ? 'text-red-400 font-extrabold' : 'text-amber-400 font-bold'}>
                      {new Date(o.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>

                  <td>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleAllocate(o.order_id, e)}
                        className="btn-secondary py-1 px-2.5 text-[11px]"
                        title="Run Allocation Engine"
                      >
                        <Layers className="w-3 h-3 text-indigo-400" />
                        Allocate
                      </button>

                      <button
                        onClick={() => navigate(`/orders/${o.order_id}`)}
                        className="btn-icon"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <WhyThisDecisionModal
        order={selectedOrderForWhy}
        onClose={() => setSelectedOrderForWhy(null)}
      />

      <AllocationDecisionModal
        data={allocationModalData}
        onClose={() => setAllocationModalData(null)}
      />
    </div>
  );
};
