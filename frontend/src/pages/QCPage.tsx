import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { apiService } from '../api/client';
import type { QCCheck } from '../types';

export const QCPage: React.FC = () => {
  const [checks, setChecks] = useState<QCCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChecks = async () => {
    try {
      const res = await apiService.getQCChecks();
      setChecks(res.checks);
    } catch {
      console.error('Failed to load QC checks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChecks();
  }, []);

  const handlePass = async (id: string) => {
    try {
      await apiService.passQC(id);
      loadChecks();
    } catch {
      alert('Failed');
    }
  };

  const handleFail = async (id: string) => {
    const reason = prompt('Enter failure reason:', 'Damaged product or quantity mismatch');
    if (!reason) return;
    try {
      await apiService.failQC(id, reason);
      loadChecks();
      alert('QC Failed. Automatic exception created for warehouse manager.');
    } catch {
      alert('Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Quality Inspection (QC Hub)
            <span className="badge bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30 text-[10px]">
              {checks.length} Inspection Orders
            </span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Automated checklist verification ensuring zero defective order dispatch
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-8 text-xs text-[var(--text-muted)]">Loading QC checks...</div>
        ) : (
          checks.map((qc) => (
            <div key={qc.qc_id} className="card space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-base">{qc.qc_id}</span>
                    <span className={`badge ${
                      qc.status === 'PASSED' ? 'badge-success' :
                      qc.status === 'FAILED' ? 'badge-critical' : 'badge-warning'
                    }`}>
                      {qc.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Order: <strong className="text-white">{qc.order_id}</strong> ({qc.customer_name})
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-[var(--text-muted)]">Inspector:</span>
                  <div className="font-semibold text-white">{qc.inspector}</div>
                </div>
              </div>

              {qc.failure_reason && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  🚨 <strong>QC Failure Reason:</strong> {qc.failure_reason}
                </div>
              )}

              {/* 6-Point QC Checklist */}
              <div className="space-y-1.5 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Mandatory Audit Checklist:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(qc.checklist).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      {value ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span className={value ? 'text-white' : 'text-red-400 font-semibold'}>
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button onClick={() => handleFail(qc.qc_id)} className="btn-danger py-1 px-3 text-xs">
                  <XCircle className="w-3.5 h-3.5" /> Fail QC
                </button>
                <button onClick={() => handlePass(qc.qc_id)} className="btn-success py-1 px-3 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pass QC
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
