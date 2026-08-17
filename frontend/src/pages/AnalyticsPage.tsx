import React, { useEffect, useState } from 'react';
import { BarChart3, AlertTriangle, Zap, CheckCircle2, Activity, Layers, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { apiService } from '../api/client';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      const [res, logsRes] = await Promise.all([
        apiService.getAnalytics(),
        apiService.getDecisionLogs(),
      ]);
      setData(res);
      setLogs(logsRes.logs);
    } catch {
      console.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-[var(--text-muted)]">
        Running bottleneck analytics...
      </div>
    );
  }

  const bn = data.bottleneck;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Analytics & Bottleneck Detection Engine
            <span className="badge bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30 text-[10px]">
              Efficiency: {data.fulfillment_efficiency}%
            </span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Automated operational bottleneck analysis, stage timing benchmarks, and resource re-allocation logic
          </p>
        </div>
      </div>

      {/* Primary Bottleneck Detection Banner */}
      <div className="card p-6 border-red-500/30 bg-gradient-to-r from-red-950/20 via-orange-950/15 to-[var(--bg-card)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Detected Operational Bottleneck</span>
              <h2 className="text-xl font-extrabold text-white mt-0.5">
                {bn.bottleneck_stage} STAGE IS THE CURRENT BOTTLENECK
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{bn.summary}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-[var(--text-muted)] font-semibold">Bottleneck Score</span>
            <div className="text-3xl font-extrabold text-red-400">{bn.bottleneck_score} / 100</div>
          </div>
        </div>

        {/* AI Recommendations for Bottleneck */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">AI Operational Recommendations:</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bn.recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {rec.action}
                  </span>
                  <span className="badge badge-critical">{rec.priority}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">{rec.reason}</p>
                <p className="text-[11px] text-emerald-400 font-semibold">Impact: {rec.expected_improvement}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stage Timings Chart vs Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="section-title text-sm">Fulfillment Stage Average Times (Min)</h3>
          <p className="section-subtitle text-xs">Actual vs Ideal Target Benchmark</p>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stage_times}>
                <XAxis dataKey="stage" stroke="hsl(220, 10%, 45%)" fontSize={11} />
                <YAxis stroke="hsl(220, 10%, 45%)" fontSize={11} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="font-semibold">{payload[0].payload.stage}</p>
                          <p className="text-red-400">Actual Avg: {payload[0].value} mins</p>
                          <p className="text-emerald-400">Benchmark: {payload[0].payload.benchmark} mins</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="avg_min" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {data.stage_times.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.stage.toUpperCase() === bn.bottleneck_stage ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Picker Productivity Table */}
        <div className="card">
          <h3 className="section-title text-sm">Picker Productivity & Efficiency</h3>
          <p className="section-subtitle text-xs">Completed tasks and blocked task ratios</p>
          <div className="table-wrapper mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Picker</th>
                  <th>Completed</th>
                  <th>Avg Time</th>
                  <th>Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {data.picker_productivity.map((p: any, i: number) => (
                  <tr key={i}>
                    <td className="font-semibold text-white">{p.name}</td>
                    <td>{p.completed_tasks} tasks</td>
                    <td className="font-mono text-xs">{p.avg_time} min</td>
                    <td>
                      <span className={`badge ${p.efficiency >= 80 ? 'badge-success' : 'badge-warning'}`}>
                        {p.efficiency}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Decision Audit Trail Log */}
      <div className="card space-y-3">
        <h3 className="section-title text-sm">AI Decision Engine Audit Trail</h3>
        <p className="section-subtitle text-xs">Immutable history of automated warehouse decisions</p>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Decision Type</th>
                <th>Decision Output</th>
                <th>Reasoning Explanation</th>
                <th>Entities Affected</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log._id}>
                  <td className="text-xs text-[var(--text-muted)] font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td><span className="badge badge-info">{log.decision_type}</span></td>
                  <td className="font-semibold text-white">{log.decision}</td>
                  <td className="text-xs text-amber-300/90 italic">{log.reason}</td>
                  <td className="font-mono text-xs text-blue-400">{log.affected_entities?.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
