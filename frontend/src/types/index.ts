// All TypeScript types for WareMind AI

export type OrderStatus = 'PENDING' | 'PICKING' | 'PACKING' | 'QC' | 'DISPATCHED' | 'DELIVERED';
export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type InventoryStatus = 'HEALTHY' | 'LOW_STOCK' | 'CRITICAL' | 'OUT_OF_STOCK' | 'OVERSTOCK';
export type AllocationStatus = 'FULLY_ALLOCATED' | 'PARTIALLY_ALLOCATED' | 'BACKORDER' | 'WAITING_FOR_REPLENISHMENT' | 'PENDING';
export type ExceptionStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type ExceptionSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type PickingStatus = 'WAITING' | 'PICKING' | 'COMPLETED' | 'BLOCKED';

export interface OrderItem {
  sku: string;
  product_name: string;
  quantity_ordered: number;
  unit_price: number;
  status: string;
}

export interface TimelineEntry {
  stage: string;
  label: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  timestamp: string | null;
}

export interface PriorityReason {
  factor: string;
  weight: number;
  impact: string;
}

export interface Order {
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_tier: string;
  order_date: string;
  items: OrderItem[];
  total_quantity: number;
  total_value: number;
  status: OrderStatus;
  priority: Priority;
  priority_score: number;
  shipping_method: string;
  sla_deadline: string;
  expected_dispatch: string;
  assigned_picker: string;
  picker_id: string;
  inventory_status: string;
  allocation_status: AllocationStatus;
  risk_level: RiskLevel;
  notes: string;
  created_at: string;
  updated_at: string;
  timeline: TimelineEntry[];
  priority_reasons: PriorityReason[];
}

export interface InventoryItem {
  sku: string;
  product_name: string;
  category: string;
  zone: string;
  bin_location: string;
  quantity_available: number;
  quantity_reserved: number;
  quantity_on_hand: number;
  reorder_level: number;
  reorder_quantity: number;
  status: InventoryStatus;
  unit_price: number;
  last_updated: string;
  avg_daily_demand: number;
  lead_time_days: number;
}

export interface PickingTask {
  task_id: string;
  order_id: string;
  customer_name: string;
  picker_id: string;
  picker_name: string;
  zones: string[];
  optimized_route: string;
  items: OrderItem[];
  priority: Priority;
  status: PickingStatus;
  estimated_time_min: number;
  actual_time_min: number | null;
  blocked_reason: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface PackingTask {
  task_id: string;
  order_id: string;
  customer_name: string;
  packer_id: string;
  packer_name: string;
  station: string;
  items: OrderItem[];
  package_type: string;
  weight_kg: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  notes: string;
}

export interface QCCheck {
  qc_id: string;
  order_id: string;
  customer_name: string;
  inspector: string;
  checklist: Record<string, boolean>;
  status: 'PASSED' | 'FAILED' | 'REQUIRES_REVIEW';
  failure_reason: string | null;
  checked_at: string;
  items: OrderItem[];
}

export interface Exception {
  exception_id: string;
  type: string;
  severity: ExceptionSeverity;
  order_id: string | null;
  sku: string | null;
  description: string;
  system_decision: string;
  recommended_action: string;
  business_impact: string;
  resolution_options: string[];
  status: ExceptionStatus;
  detected_at: string;
  resolution_notes: string | null;
  resolved_at: string | null;
  assigned_to: string;
}

export interface Dispatch {
  dispatch_id: string;
  order_id: string;
  customer_name: string;
  carrier: string;
  tracking_number: string;
  package_count: number;
  weight_kg: number;
  status: string;
  dispatched_at: string | null;
  expected_delivery: string;
  actual_delivery: string | null;
  delay_risk: string;
  notes: string;
}

export interface Notification {
  _id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface DashboardAlert {
  id: string;
  severity: string;
  title: string;
  description: string;
  recommended_action: string;
  reason: string;
  action_route?: string;
  order_ids?: string[];
  skus?: string[];
}

export interface DashboardData {
  summary: {
    total_orders: number;
    pending_orders: number;
    picking_orders: number;
    packing_orders: number;
    qc_orders: number;
    dispatched_orders: number;
    delivered_orders: number;
    at_risk_orders: number;
    critical_orders: number;
    blocked_picking: number;
    open_exceptions: number;
    critical_exceptions: number;
    fulfillment_rate: number;
    avg_fulfillment_hours: number;
  };
  inventory: {
    total_skus: number;
    healthy: number;
    low_stock: number;
    critical: number;
    out_of_stock: number;
    overstock: number;
    total_value: number;
  };
  charts: {
    orders_by_status: { name: string; value: number; color: string }[];
    orders_by_priority: { name: string; value: number; color: string }[];
    inventory_health: { name: string; value: number; color: string }[];
    daily_trend: { date: string; fulfilled: number; created: number }[];
    zone_performance: { zone: string; efficiency: number; tasks: number; blocked: number }[];
    fast_moving_products: { sku: string; name: string; avg_daily: number }[];
  };
  alerts: DashboardAlert[];
  notifications_unread: number;
}

export interface AllocationResult {
  sku: string;
  product_name: string;
  required: number;
  available: number;
  reserved_by_others: number;
  allocated: number;
  shortage: number;
  status: string;
  reason: string;
}

export interface ReplenishmentRecommendation {
  sku: string;
  product_name: string;
  current_stock: number;
  reorder_level: number;
  avg_daily_demand: number;
  days_until_stockout: number | null;
  lead_time_days: number;
  stockout_risk: string;
  risk_score: number;
  should_reorder: boolean;
  recommended_quantity: number;
  recommended_reorder_date: string | null;
  reason: string;
  estimated_cost: number;
}

export interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  warehouse: string;
}

export interface CopilotResponse {
  intent: string;
  answer: string;
  data: unknown;
  actions: string[];
  severity: string;
}

export interface SimulationResult {
  simulation: string;
  system_response: string;
  [key: string]: unknown;
}
