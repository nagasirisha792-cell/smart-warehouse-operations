import React from 'react';
import { X, CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';
import type { Order } from '../../types';

interface WhyThisDecisionModalProps {
  order: Order | null;
  onClose: () => void;
}

export const WhyThisDecisionModal: React.FC<WhyThisDecisionModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const score = order.priority_score;
  const priority = order.priority;
  const reasons = order.priority_reasons || [];

  return (
    <div className="modal-overlay">
      <div className="modal-content border border-blue-500/30">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Decision Explainability Engine</h3>
              <p className="text-xs text-slate-400">Why is Order {order.order_id} classified as {priority}?</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="modal-body space-y-5">
          {/* Main Score Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[#162035] border border-blue-500/30 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Priority Classification</span>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-2xl font-black ${
                  priority === 'CRITICAL' ? 'text-red-400' :
                  priority === 'HIGH' ? 'text-orange-400' :
                  priority === 'MEDIUM' ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {priority}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-extrabold border border-blue-500/30">
                  Priority Score: {score} / 100
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Customer Tier</span>
              <div className="text-sm font-extrabold text-white mt-0.5">{order.customer_tier}</div>
            </div>
          </div>

          {/* Factor Breakdown */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              Weighted Decision Factors breakdown
            </h4>
            <div className="space-y-2.5">
              {reasons.length === 0 ? (
                <div className="text-xs text-slate-400 italic">Standard priority calculation algorithm applied.</div>
              ) : (
                reasons.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#162035] border border-[rgba(59,130,246,0.15)] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {r.impact === 'CRITICAL' || r.impact === 'HIGH' ? (
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      ) : r.impact === 'NEGATIVE' ? (
                        <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                      <span className="text-white font-semibold">{r.factor}</span>
                    </div>
                    <span className={`font-mono font-bold px-2.5 py-1 rounded-lg text-xs ${
                      r.weight > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'
                    }`}>
                      {r.weight > 0 ? `+${r.weight} pts` : `${r.weight} pts`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Order Details Summary */}
          <div className="p-4 rounded-xl bg-[#0f1523] border border-[rgba(59,130,246,0.15)] text-xs space-y-2 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Customer:</span>
              <span className="text-white font-bold">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Shipping Method:</span>
              <span className="text-white font-bold">{order.shipping_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">SLA Target:</span>
              <span className="text-amber-400 font-mono font-bold">
                {new Date(order.sla_deadline).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary">
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};
