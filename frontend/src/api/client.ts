import axios from 'axios';
import type {
  DashboardData,
  Order,
  InventoryItem,
  PickingTask,
  PackingTask,
  QCCheck,
  Exception,
  Dispatch,
  Notification,
  ReplenishmentRecommendation,
  CopilotResponse,
  SimulationResult,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Auth
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then((res) => res.data),

  // Dashboard
  getDashboard: (): Promise<DashboardData> =>
    api.get('/dashboard').then((res) => res.data),

  // Orders
  getOrders: (params?: Record<string, string>): Promise<{ orders: Order[]; total: number }> =>
    api.get('/orders', { params }).then((res) => res.data),

  getOrder: (id: string): Promise<Order> =>
    api.get(`/orders/${id}`).then((res) => res.data),

  prioritizeOrder: (id: string) =>
    api.post(`/orders/${id}/prioritize`).then((res) => res.data),

  allocateOrder: (id: string) =>
    api.post(`/orders/${id}/allocate`).then((res) => res.data),

  advanceOrder: (id: string) =>
    api.post(`/orders/${id}/advance`).then((res) => res.data),

  createOrder: (data: Record<string, unknown>) =>
    api.post('/orders', data).then((res) => res.data),

  // Inventory
  getInventory: (params?: Record<string, string>): Promise<{ inventory: InventoryItem[]; total: number }> =>
    api.get('/inventory', { params }).then((res) => res.data),

  getInventoryStats: () =>
    api.get('/inventory/stats').then((res) => res.data),

  getReorderRecommendations: (): Promise<{ recommendations: ReplenishmentRecommendation[]; summary: unknown }> =>
    api.get('/inventory/reorder-recommendations').then((res) => res.data),

  getInventoryItem: (sku: string) =>
    api.get(`/inventory/${sku}`).then((res) => res.data),

  adjustInventory: (sku: string, delta: number, reason: string) =>
    api.post(`/inventory/${sku}/adjust`, { delta, reason }).then((res) => res.data),

  // Picking
  getPickingTasks: (): Promise<{ tasks: PickingTask[]; total: number }> =>
    api.get('/picking').then((res) => res.data),

  startPicking: (taskId: string) =>
    api.post(`/picking/${taskId}/start`).then((res) => res.data),

  completePicking: (taskId: string) =>
    api.post(`/picking/${taskId}/complete`).then((res) => res.data),

  blockPicking: (taskId: string, reason: string) =>
    api.post(`/picking/${taskId}/block`, { reason }).then((res) => res.data),

  // Packing
  getPackingTasks: (): Promise<{ tasks: PackingTask[]; total: number }> =>
    api.get('/packing').then((res) => res.data),

  completePacking: (taskId: string) =>
    api.post(`/packing/${taskId}/complete`).then((res) => res.data),

  reportDamagedPacking: (taskId: string, sku: string, description: string) =>
    api.post(`/packing/${taskId}/report-damaged`, { sku, description }).then((res) => res.data),

  // QC
  getQCChecks: (): Promise<{ checks: QCCheck[]; total: number }> =>
    api.get('/qc').then((res) => res.data),

  passQC: (qcId: string) =>
    api.post(`/qc/${qcId}/pass`).then((res) => res.data),

  failQC: (qcId: string, reason: string) =>
    api.post(`/qc/${qcId}/fail`, { reason }).then((res) => res.data),

  // Exceptions
  getExceptions: (params?: Record<string, string>): Promise<{ exceptions: Exception[]; total: number }> =>
    api.get('/exceptions', { params }).then((res) => res.data),

  getExceptionStats: () =>
    api.get('/exceptions/stats').then((res) => res.data),

  resolveException: (exceptionId: string, notes: string, resolvedBy: string) =>
    api.post(`/exceptions/${exceptionId}/resolve`, { notes, resolved_by: resolvedBy }).then((res) => res.data),

  assignException: (exceptionId: string, assignedTo: string) =>
    api.post(`/exceptions/${exceptionId}/assign`, { assigned_to: assignedTo }).then((res) => res.data),

  // Dispatch
  getDispatches: (): Promise<{ dispatches: Dispatch[]; total: number }> =>
    api.get('/dispatch').then((res) => res.data),

  markDispatched: (dispatchId: string) =>
    api.post(`/dispatch/${dispatchId}/dispatch`).then((res) => res.data),

  // Analytics
  getAnalytics: () =>
    api.get('/analytics').then((res) => res.data),

  getDecisionLogs: () =>
    api.get('/analytics/decisions').then((res) => res.data),

  // Notifications
  getNotifications: (): Promise<{ notifications: Notification[]; unread_count: number }> =>
    api.get('/notifications').then((res) => res.data),

  markNotificationRead: (id: string) =>
    api.post(`/notifications/${id}/read`).then((res) => res.data),

  markAllNotificationsRead: () =>
    api.post('/notifications/read-all').then((res) => res.data),

  // Simulation
  simulateStockShortage: (sku: string, reduceBy: number): Promise<SimulationResult> =>
    api.post('/simulation/stock-shortage', { sku, reduce_by: reduceBy }).then((res) => res.data),

  simulateUrgentOrder: (customer: string, sku: string, quantity: number): Promise<SimulationResult> =>
    api.post('/simulation/urgent-order', { customer, sku, quantity }).then((res) => res.data),

  simulateDamagedItem: (sku: string, quantity: number, orderId?: string): Promise<SimulationResult> =>
    api.post('/simulation/damage-item', { sku, quantity, order_id: orderId }).then((res) => res.data),

  simulateDelayOrder: (orderId: string): Promise<SimulationResult> =>
    api.post('/simulation/delay-order', { order_id: orderId }).then((res) => res.data),

  // Copilot
  queryCopilot: (question: string): Promise<CopilotResponse> =>
    api.post('/copilot/query', { question }).then((res) => res.data),
};
