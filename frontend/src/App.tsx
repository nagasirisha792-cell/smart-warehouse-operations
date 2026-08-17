import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { InventoryPage } from './pages/InventoryPage';
import { InventoryDetailPage } from './pages/InventoryDetailPage';
import { PickingPage } from './pages/PickingPage';
import { PackingPage } from './pages/PackingPage';
import { QCPage } from './pages/QCPage';
import { ExceptionsPage } from './pages/ExceptionsPage';
import { DispatchPage } from './pages/DispatchPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

import { CopilotDrawer } from './components/copilot/CopilotDrawer';
import { SimulationPanel } from './components/simulation/SimulationPanel';

import { apiService } from './api/client';
import type { User, Notification } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('waremind_user');
    return saved ? JSON.parse(saved) : { id: 'U002', name: 'Alex Thompson', role: 'WAREHOUSE_MANAGER', email: 'alex@waremind.ai', warehouse: 'WH-001' };
  });

  const [role, setRole] = useState<string>(() => user?.role || 'WAREHOUSE_MANAGER');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('waremind_theme') as 'dark' | 'light';
    return savedTheme || 'dark';
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('waremind_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const loadNotifications = async () => {
    try {
      const res = await apiService.getNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unread_count);
    } catch {
      // ignore silently if offline
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    setRole(u.role);
    localStorage.setItem('waremind_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('waremind_user');
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      loadNotifications();
    } catch {
      // handle error
    }
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Router>
      <Layout
        user={user}
        role={role}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        onLogout={handleLogout}
        onRoleChange={(newRole) => setRole(newRole)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenSimulation={() => setIsSimulationOpen(true)}
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/:sku" element={<InventoryDetailPage />} />
          <Route path="/picking" element={<PickingPage />} />
          <Route path="/packing" element={<PackingPage />} />
          <Route path="/qc" element={<QCPage />} />
          <Route path="/exceptions" element={<ExceptionsPage />} />
          <Route path="/dispatch" element={<DispatchPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {/* Floating Drawers & Panels */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      <SimulationPanel
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        onRefreshData={loadNotifications}
      />
    </Router>
  );
}
