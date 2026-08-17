import React, { useState } from 'react';
import { Layers, Lock, User as UserIcon, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import type { User } from '../types';
import { apiService } from '../api/client';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('manager');
  const [password, setPassword] = useState('manager123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiService.login(username, password);
      onLoginSuccess(res.user);
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/20 mb-2">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            WareMind <span className="text-xs bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded border border-blue-500/30">AI</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            Intelligent Decisions. Faster Fulfillment. Smarter Warehouses.
          </p>
        </div>

        {/* Login Card */}
        <div className="card p-6 shadow-2xl border-[var(--border)] bg-[var(--bg-card)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Username</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input w-full pl-9 py-2 text-xs"
                  placeholder="Enter username..."
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full pl-9 py-2 text-xs"
                  placeholder="Enter password..."
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-xs font-bold shadow-lg shadow-blue-500/20"
            >
              {loading ? 'Authenticating...' : 'Enter Operations Command Center'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-[var(--border-subtle)] space-y-2">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block text-center">
              Quick Demo Accounts (1-Click Fill)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickLogin('manager', 'manager123')}
                className="p-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[hsl(220,14%,20%)] border border-[var(--border)] text-left transition-colors"
              >
                <div className="font-semibold text-white">Manager</div>
                <div className="text-[10px] text-[var(--text-muted)]">Full WH Access</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickLogin('admin', 'admin123')}
                className="p-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[hsl(220,14%,20%)] border border-[var(--border)] text-left transition-colors"
              >
                <div className="font-semibold text-white">Admin</div>
                <div className="text-[10px] text-[var(--text-muted)]">System Config</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickLogin('picker1', 'picker123')}
                className="p-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[hsl(220,14%,20%)] border border-[var(--border)] text-left transition-colors"
              >
                <div className="font-semibold text-white">Picker</div>
                <div className="text-[10px] text-[var(--text-muted)]">Picking Queue</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickLogin('qc1', 'qc123')}
                className="p-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[hsl(220,14%,20%)] border border-[var(--border)] text-left transition-colors"
              >
                <div className="font-semibold text-white">Quality Control</div>
                <div className="text-[10px] text-[var(--text-muted)]">QC Checklist</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
