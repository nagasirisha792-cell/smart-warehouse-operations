import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight, RefreshCw, Filter } from 'lucide-react';
import { apiService } from '../api/client';
import type { Exception } from '../types';

export const ExceptionsPage: React.FC = () => {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const loadData = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;

      const [exRes, statsRes] = await Promise.all([
        apiService.getExceptions(params),
        apiService.getExceptionStats(),
      ]);

      setExceptions(exRes.exceptions);
      setStats(statsRes);
    } catch {
      console.error('Failed to load exceptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, severityFilter]);

  const handleResolve = async (id: string) => {
    const notes = prompt('Enter resolution notes:', 'Issue resolved according to warehouse SOP.');
    if (!notes) return;
    try {
      await apiService.resolveException(id, notes, 'Warehouse Manager');
      loadData();
      alert(`Exception ${id} marked as RESOLVED.`);
    } catch {
      alert('Failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Exception & Crisis Control Center
            <span className="badge bg-red-500/20 text-red-400 font-semibold border border-red-500/30 text-[10px]">
              {stats?.open || 0} OPEN EXCEPTIONS
            </span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Core Differentiator: Exception → Decision → Resolution Engine
          </p>
        </div>
      </div>

      {/* Stats KPI */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="stat-card bg-red-950/20 border-red-500/20">
            <span className="stat-label text-red-400">Critical Severity</span>
            <div className="stat-value mt-1 text-red-400">{stats.critical}</div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Open Exceptions</span>
            <div className="stat-value mt-1 text-amber-400">{stats.open}</div>
          </div>
          <div className="stat-card">
            <span className="stat-label">In Progress</span>
            <div className="stat-value mt-1 text-blue-400">{stats.in_progress}</div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Resolved Today</span>
            <div className="stat-value mt-1 text-emerald-400">{stats.resolved}</div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Exceptions</span>
            <div className="stat-value mt-1 text-white">{stats.total}</div>
          </div>
        </div>
      )}

      {/* Filter controls */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="select text-xs py-1.5"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select text-xs py-1.5"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Main Exceptions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-xs text-[var(--text-muted)]">Loading exception engine...</div>
        ) : (
          exceptions.map((ex) => (
            <div
              key={ex.exception_id}
              className={`card p-5 space-y-4 border ${
                ex.severity === 'CRITICAL' ? 'bg-red-950/15 border-red-500/30' :
                ex.severity === 'HIGH' ? 'bg-orange-950/15 border-orange-500/30' :
                'bg-[var(--bg-card)]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-white text-base">{ex.exception_id}</span>
                  <span className={`badge ${
                    ex.severity === 'CRITICAL' ? 'badge-critical' :
                    ex.severity === 'HIGH' ? 'badge-high' : 'badge-warning'
                  }`}>
                    {ex.severity}
                  </span>
                  <span className="badge badge-info">{ex.type.replace(/_/g, ' ')}</span>
                  <span className={`badge ${
                    ex.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {ex.status}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] font-mono">
                  Detected: {new Date(ex.detected_at).toLocaleString()}
                </div>
              </div>

              {/* Exception → Decision → Resolution Triad */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* 1. Exception Problem */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1.5">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">1. Problem & Impact</span>
                  <p className="text-white font-semibold">{ex.description}</p>
                  <p className="text-[11px] text-[var(--text-muted)] italic mt-1">{ex.business_impact}</p>
                </div>

                {/* 2. System Decision */}
                <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">2. System AI Decision</span>
                  <p className="text-white font-semibold">{ex.system_decision}</p>
                  <p className="text-[11px] text-blue-300">💡 {ex.recommended_action}</p>
                </div>

                {/* 3. Resolution */}
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">3. Resolution Options</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ex.resolution_options.map((opt, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20">
                        {opt.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                  {ex.resolution_notes && (
                    <p className="text-[11px] text-emerald-200 mt-2 italic">Notes: {ex.resolution_notes}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                {ex.status !== 'RESOLVED' && (
                  <button onClick={() => handleResolve(ex.exception_id)} className="btn-success py-1.5 px-4 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Execute Resolution
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
