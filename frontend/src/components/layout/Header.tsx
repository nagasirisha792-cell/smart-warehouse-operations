import React, { useState } from 'react';
import { Bell, Search, Warehouse, LogOut, AlertTriangle, Info, Sparkles, Sun, Moon } from 'lucide-react';
import type { Notification, User } from '../../types';

interface HeaderProps {
  user: User;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onLogout: () => void;
  role: string;
  onRoleChange: (newRole: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  notifications,
  unreadCount,
  onMarkAllRead,
  onLogout,
  role,
  onRoleChange,
  theme,
  onToggleTheme,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 bg-[var(--bg-secondary)] backdrop-blur-md border-b border-[var(--border)] px-6 flex items-center justify-between sticky top-0 z-20 shadow-md">
      {/* Search Bar */}
      <div className="flex items-center gap-4 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search orders (ORD-1001), SKUs, customers..."
            className="input w-full pl-10 py-2 text-xs"
          />
        </div>
      </div>

      {/* Ticker & Operational Meta */}
      <div className="hidden lg:flex items-center gap-3 text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 font-bold text-[11px]">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-500" />
          <span>AI DECISION ENGINE ACTIVE</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
          <Warehouse className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-bold text-[var(--text-primary)]">WH-001 MAIN HUB</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Sun / Moon Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="btn-icon border border-[var(--border)] bg-[var(--bg-elevated)]"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4.5 h-4.5 text-amber-400" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-indigo-600" />
          )}
        </button>

        {/* Role Switcher */}
        <div className="flex items-center gap-2 bg-[var(--bg-elevated)] px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs">
          <span className="text-[var(--text-muted)] font-semibold text-[11px] uppercase">Role:</span>
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            className="bg-transparent font-extrabold text-xs border-0 focus:outline-none cursor-pointer text-[var(--text-primary)]"
          >
            <option value="ADMIN" className="bg-[var(--bg-secondary)]">ADMIN</option>
            <option value="WAREHOUSE_MANAGER" className="bg-[var(--bg-secondary)]">WAREHOUSE MANAGER</option>
            <option value="PICKER" className="bg-[var(--bg-secondary)]">PICKER</option>
            <option value="PACKER" className="bg-[var(--bg-secondary)]">PACKER</option>
            <option value="QUALITY_INSPECTOR" className="bg-[var(--bg-secondary)]">QUALITY INSPECTOR</option>
          </select>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn-icon relative border border-[var(--border)] bg-[var(--bg-elevated)]"
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5 text-[var(--text-secondary)]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            )}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm shadow-red-500" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
              <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
                <span className="font-bold text-xs text-[var(--text-primary)]">Notifications ({unreadCount} unread)</span>
                <button onClick={onMarkAllRead} className="text-[11px] text-blue-500 hover:underline font-semibold">
                  Mark all read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[var(--text-muted)]">No notifications</div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div key={n._id} className={`p-3 text-xs flex gap-3 ${!n.read ? 'bg-blue-500/5' : ''}`}>
                      {n.severity === 'CRITICAL' ? (
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">{n.title}</div>
                        <div className="text-[var(--text-secondary)] mt-0.5">{n.message}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-1">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-500/20">
              {user.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-[var(--text-primary)] leading-tight">{user.name}</div>
              <div className="text-[10px] text-[var(--text-muted)] font-semibold leading-tight">{role}</div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-2xl shadow-2xl z-50 overflow-hidden py-1">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="text-xs font-bold text-[var(--text-primary)]">{user.name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2 font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
