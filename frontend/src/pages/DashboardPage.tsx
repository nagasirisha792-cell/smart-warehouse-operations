import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  PackageCheck,
  ShieldCheck,
  Truck,
  AlertTriangle,
  Zap,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
import { apiService } from '../api/client';
import type { DashboardData } from '../types';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const res = await apiService.getDashboard();
      setData(res);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-xs text-slate-400 space-y-3">
        <div className="spinner" />
        <span className="font-semibold text-slate-300">Synchronizing AI Command Center...</span>
      </div>
    );
  }

  const summary = data.summary || {
    total_orders: 0, pending_orders: 0, picking_orders: 0, packing_orders: 0,
    qc_orders: 0, dispatched_orders: 0, delivered_orders: 0, at_risk_orders: 0, open_exceptions: 0,
  };
  const charts = data.charts || {
    orders_by_status: [], inventory_health: [], daily_trend: [],
  };
  const alerts = data.alerts || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-[#0f1523] p-6 rounded-3xl border border-blue-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Operations Command Center</h1>
            <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold text-[10px] shadow-sm shadow-emerald-500/20">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              LIVE ENGINE ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Real-time decision intelligence engine continuously monitoring 8-stage order fulfillment lifecycle.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate('/orders')} className="btn-secondary">
            View Orders ({summary.total_orders})
          </button>
          <button onClick={() => navigate('/exceptions')} className="btn-primary">
            Exception Center ({summary.open_exceptions})
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="stat-card">
          <div className="flex justify-between items-start">
            <span className="stat-label">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="stat-value mt-2">{summary.total_orders}</div>
          <span className="text-[11px] text-slate-400">Live in pipeline</span>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <span className="stat-label">Pending</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="stat-value mt-2 text-amber-400">{summary.pending_orders}</div>
          <span className="text-[11px] text-slate-400">Awaiting picking</span>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <span className="stat-label">Being Picked</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="stat-value mt-2 text-blue-400">{summary.picking_orders}</div>
          <span className="text-[11px] text-slate-400">In active zones</span>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <span className="stat-label">QC & Packed</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="stat-value mt-2 text-indigo-400">{(summary.packing_orders || 0) + (summary.qc_orders || 0)}</div>
          <span className="text-[11px] text-slate-400">Inspection stage</span>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <span className="stat-label">Dispatched</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="stat-value mt-2 text-emerald-400">{summary.dispatched_orders}</div>
          <span className="text-[11px] text-slate-400">Out for delivery</span>
        </div>

        <div className="stat-card bg-gradient-to-b from-red-950/30 to-[#121a2a] border-red-500/30">
          <div className="flex justify-between items-start">
            <span className="stat-label text-red-400">At-Risk / SLA</span>
            <div className="p-2 rounded-xl bg-red-500/15 text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="stat-value mt-2 text-red-400">{summary.at_risk_orders}</div>
          <span className="text-[11px] text-red-300 font-semibold">Intervention required</span>
        </div>
      </div>

      {/* AI Operations Alert Feed */}
      <div className="card space-y-4 border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-[#121a2a] to-[#0f1523]">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AI Operations Alert Feed
                <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-lg border border-amber-500/30">
                  {alerts.length} Action Recommendations
                </span>
              </h2>
              <p className="text-xs text-slate-400">Automated decision engine exception detection and resolution advice</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                alert.severity === 'CRITICAL' ? 'alert-critical' :
                alert.severity === 'HIGH' ? 'alert-high' : 'alert-medium'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`badge ${
                    alert.severity === 'CRITICAL' ? 'badge-critical' :
                    alert.severity === 'HIGH' ? 'badge-high' : 'badge-warning'
                  }`}>
                    {alert.severity}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">AI DETECTED</span>
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">{alert.title}</h4>
                <p className="text-[11px] text-slate-300">{alert.description}</p>
              </div>

              <div className="pt-2.5 border-t border-slate-800/60 space-y-2">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Why this decision?</span>
                  <p className="text-[11px] text-amber-300/90 italic font-medium">{alert.reason}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-bold text-blue-400">💡 {alert.recommended_action}</span>
                  {alert.action_route && (
                    <button
                      onClick={() => navigate(alert.action_route!)}
                      className="btn-primary py-1 px-3 text-[11px] font-bold flex items-center gap-1"
                    >
                      Act Now <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders by Status */}
        <div className="card">
          <h3 className="section-title text-sm">Fulfillment Status Breakdown</h3>
          <p className="section-subtitle text-xs">Live order distribution across 8 stages</p>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.orders_by_status || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(charts.orders_by_status || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="font-bold">{payload[0].name}: {payload[0].value} orders</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2 text-xs">
            {(charts.orders_by_status || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-medium">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Health */}
        <div className="card">
          <h3 className="section-title text-sm">Inventory Health Status</h3>
          <p className="section-subtitle text-xs">50 SKUs stock level distribution</p>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.inventory_health || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(charts.inventory_health || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="font-bold">{payload[0].name}: {payload[0].value} SKUs</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2 text-xs">
            {(charts.inventory_health || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-medium">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Fulfillment Trend */}
        <div className="card">
          <h3 className="section-title text-sm">Daily Fulfillment Trend</h3>
          <p className="section-subtitle text-xs">Created vs Dispatched (7 days)</p>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.daily_trend || []}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="font-bold">{label}</p>
                          <p className="text-blue-400">Created: {payload[0].value}</p>
                          <p className="text-emerald-400">Fulfilled: {payload[1]?.value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="fulfilled" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 justify-center mt-2 text-xs">
            <span className="flex items-center gap-1 text-blue-400 font-semibold">● Created</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">● Fulfilled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
