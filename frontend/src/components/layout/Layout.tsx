import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { Notification, User } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onLogout: () => void;
  role: string;
  onRoleChange: (newRole: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenCopilot: () => void;
  onOpenSimulation: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  user,
  notifications,
  unreadCount,
  onMarkAllRead,
  onLogout,
  role,
  onRoleChange,
  theme,
  onToggleTheme,
  onOpenCopilot,
  onOpenSimulation,
}) => {
  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden transition-colors">
      <Sidebar
        role={role}
        onOpenCopilot={onOpenCopilot}
        onOpenSimulation={onOpenSimulation}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={user}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllRead={onMarkAllRead}
          onLogout={onLogout}
          role={role}
          onRoleChange={onRoleChange}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
