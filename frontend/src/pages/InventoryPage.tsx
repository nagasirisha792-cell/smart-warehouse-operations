import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Boxes, AlertTriangle, RefreshCw, Eye, TrendingUp, Plus, ArrowUpRight } from 'lucide-react';
import { apiService } from '../api/client';
import type { InventoryItem, ReplenishmentRecommendation } from '../types';

export const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recommendations, setRecommendations] = useState<ReplenishmentRecommendation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (zoneFilter) params.zone = zoneFilter;
      if (search) params.search = search;

      const [invRes, statsRes, recRes] = await Promise.all([
        apiService.getInventory(params),
        apiService.getInventoryStats(),
        apiService.getReorderRecommendations(),
      ]);

      setInventory(invRes.inventory);
      setStats(statsRes);
      setRecommendations(recRes.recommendations);
    } catch {
      console.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, zoneFilter, search]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Inventory & Replenishment Intelligence
            <span className="badge bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30 text-[10px]">
              {stats?.total_skus || 50} SKUs
            </span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time stock level monitoring with predictive AI reorder recommendations
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="stat-card">
            <span className="stat-label">Total Inventory Value</span>
            <div className="stat-value mt-1 text-emerald-400">${stats.total_value.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Healthy Stock</span>
            <div className="stat-value mt-1 text-emerald-400">{stats.healthy} SKUs</div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Low Stock</span>
            <div className="stat-value mt-1 text-amber-400">{stats.low_stock} SKUs</div>
          </div>
          <div className="stat-card bg-orange-950/20 border-orange-500/20">
            <span className="stat-label text-orange-400">Critical Stock</span>
            <div className="stat-value mt-1 text-orange-400">{stats.critical} SKUs</div>
          </div>
          <div className="stat-card bg-red-950/20 border-red-500/20">
            <span className="stat-label text-red-400">Out of Stock</span>
            <div className="stat-value mt-1 text-red-400">{stats.out_of_stock} SKUs</div>
          </div>
        </div>
      )}

      {/* AI Reorder Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="card border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-[var(--bg-card)] space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                AI Smart Replenishment Recommendations ({recommendations.length} Action Items)
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map((rec) => (
              <div key={rec.sku} className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white">{rec.sku}</span>
                  <span className={`badge ${
                    rec.stockout_risk === 'IMMEDIATE' ? 'badge-critical' :
                    rec.stockout_risk === 'CRITICAL' ? 'badge-critical' : 'badge-warning'
                  }`}>
                    Risk: {rec.stockout_risk}
                  </span>
                </div>
                <div className="text-white font-medium truncate">{rec.product_name}</div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  Stock: <strong className="text-white">{rec.current_stock}</strong> • Avg Demand: <strong className="text-white">{rec.avg_daily_demand} / day</strong>
                </div>
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] italic">
                  💡 {rec.reason}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-emerald-400">Reorder {rec.recommended_quantity} units</span>
                  <button
                    onClick={() => navigate(`/inventory/${rec.sku}`)}
                    className="btn-primary py-1 px-2 text-[11px]"
                  >
                    Generate PO
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by SKU, product name, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-9 py-1.5 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select text-xs py-1.5"
          >
            <option value="">All Statuses</option>
            <option value="HEALTHY">HEALTHY</option>
            <option value="LOW_STOCK">LOW_STOCK</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
            <option value="OVERSTOCK">OVERSTOCK</option>
          </select>

          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="select text-xs py-1.5"
          >
            <option value="">All Warehouse Zones</option>
            <option value="Zone A">Zone A</option>
            <option value="Zone B">Zone B</option>
            <option value="Zone C">Zone C</option>
            <option value="Zone D">Zone D</option>
            <option value="Zone E">Zone E</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Location</th>
              <th>Available</th>
              <th>Reserved</th>
              <th>Reorder Level</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-xs text-[var(--text-muted)]">
                  Loading inventory...
                </td>
              </tr>
            ) : (
              inventory.map((item) => (
                <tr
                  key={item.sku}
                  onClick={() => navigate(`/inventory/${item.sku}`)}
                  className="cursor-pointer"
                >
                  <td className="font-mono font-bold text-white">{item.sku}</td>
                  <td className="font-medium text-white">{item.product_name}</td>
                  <td>{item.category}</td>
                  <td>
                    <div className="text-xs text-white font-medium">{item.zone}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">{item.bin_location}</div>
                  </td>
                  <td className="font-bold text-white">{item.quantity_available}</td>
                  <td className="text-[var(--text-secondary)]">{item.quantity_reserved}</td>
                  <td className="text-[var(--text-muted)]">{item.reorder_level}</td>
                  <td>
                    <span className={`badge ${
                      item.status === 'HEALTHY' ? 'badge-success' :
                      item.status === 'LOW_STOCK' ? 'badge-warning' :
                      item.status === 'CRITICAL' ? 'badge-critical' :
                      item.status === 'OUT_OF_STOCK' ? 'badge-critical' : 'badge-low'
                    }`}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/inventory/${item.sku}`);
                      }}
                      className="btn-icon"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
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
