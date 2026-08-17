import React from 'react';
import { X, Layers, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { AllocationResult } from '../../types';

interface AllocationDecisionModalProps {
  data: {
    order_id: string;
    overall_status: string;
    item_allocations: AllocationResult[];
    total_shortage: number;
    affected_orders: string[];
    recommendation: {
      action: string;
      title: string;
      description: string;
      urgency: string;
      steps: string[];
    };
  } | null;
  onClose: () => void;
}

export const AllocationDecisionModal: React.FC<AllocationDecisionModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content border border-indigo-500/30">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Smart Inventory Allocation Engine</h3>
              <p className="text-xs text-slate-400">Allocation breakdown for Order: {data.order_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="modal-body space-y-5">
          {/* Status Header */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-lg ${
            data.overall_status === 'FULLY_ALLOCATED' ? 'bg-emerald-950/40 border-emerald-500/30' :
            data.overall_status === 'PARTIALLY_ALLOCATED' ? 'bg-amber-950/40 border-amber-500/30' :
            'bg-red-950/40 border-red-500/30'
          }`}>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Allocation Result</span>
              <div className="text-xl font-black text-white mt-0.5">{data.overall_status.replace(/_/g, ' ')}</div>
            </div>
            {data.total_shortage > 0 && (
              <div className="text-right">
                <span className="text-xs text-red-400 font-bold">Total Stock Shortage</span>
                <div className="text-lg font-extrabold text-red-400">{data.total_shortage} units</div>
              </div>
            )}
          </div>

          {/* Allocation Table */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">Item Allocation Breakdown</h4>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU / Item</th>
                    <th>Req.</th>
                    <th>Avail.</th>
                    <th>Allocated</th>
                    <th>Shortage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.item_allocations.map((item, i) => (
                    <tr key={i}>
                      <td className="font-mono font-bold text-white">
                        {item.sku}
                        <div className="text-[11px] text-slate-400 font-sans font-normal">{item.product_name}</div>
                      </td>
                      <td className="font-bold text-white">{item.required}</td>
                      <td>{item.available}</td>
                      <td className="font-bold text-emerald-400">{item.allocated}</td>
                      <td className={`font-bold ${item.shortage > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {item.shortage}
                      </td>
                      <td>
                        <span className={`badge ${
                          item.status === 'FULLY_ALLOCATED' ? 'badge-success' :
                          item.status === 'PARTIALLY_ALLOCATED' ? 'badge-warning' : 'badge-critical'
                        }`}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Recommendation Box */}
          <div className="p-4 rounded-2xl bg-[#162035] border border-blue-500/20 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Recommended Action ({data.recommendation.urgency} URGENCY)</span>
            </div>
            <p className="text-xs font-bold text-white">{data.recommendation.title}</p>
            <p className="text-xs text-slate-300">{data.recommendation.description}</p>
            
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Execution Steps:</span>
              <ul className="mt-2 space-y-1.5">
                {data.recommendation.steps.map((step, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary">
            Confirm & Apply Allocation
          </button>
        </div>
      </div>
    </div>
  );
};
