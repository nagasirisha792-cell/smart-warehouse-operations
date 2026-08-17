"""Dashboard router – aggregated warehouse command center data."""
from fastapi import APIRouter
from database.mock_db import get_collection, find_many
from engines.replenishment_engine import ReplenishmentEngine
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])
replenishment = ReplenishmentEngine()


@router.get("")
def get_dashboard():
    orders = get_collection("orders")
    inventory = get_collection("inventory")
    exceptions = get_collection("exceptions")
    picking = get_collection("picking_tasks")
    dispatches = get_collection("dispatches")
    notifications = get_collection("notifications")

    # Order counts
    total_orders = len(orders)
    pending = len([o for o in orders if o["status"] == "PENDING"])
    picking_count = len([o for o in orders if o["status"] == "PICKING"])
    packing_count = len([o for o in orders if o["status"] == "PACKING"])
    qc_count = len([o for o in orders if o["status"] == "QC"])
    dispatched = len([o for o in orders if o["status"] == "DISPATCHED"])
    delivered = len([o for o in orders if o["status"] == "DELIVERED"])

    # Inventory metrics
    inv_healthy = len([i for i in inventory if i["status"] == "HEALTHY"])
    inv_low = len([i for i in inventory if i["status"] == "LOW_STOCK"])
    inv_critical = len([i for i in inventory if i["status"] == "CRITICAL"])
    inv_oos = len([i for i in inventory if i["status"] == "OUT_OF_STOCK"])
    inv_overstock = len([i for i in inventory if i["status"] == "OVERSTOCK"])
    total_inv_value = sum(
        i.get("quantity_available", 0) * i.get("unit_price", 0) for i in inventory
    )

    # Risk metrics
    at_risk = len([o for o in orders if o.get("risk_level") == "HIGH" and o["status"] not in ["DISPATCHED","DELIVERED"]])
    critical_orders = len([o for o in orders if o.get("priority") == "CRITICAL" and o["status"] not in ["DISPATCHED","DELIVERED"]])

    # Fulfillment rate
    completed = dispatched + delivered
    fulfillment_rate = round((completed / total_orders) * 100, 1) if total_orders > 0 else 0

    # Exceptions
    open_exceptions = len([e for e in exceptions if e["status"] in ["OPEN", "IN_PROGRESS"]])
    critical_exceptions = len([e for e in exceptions if e["severity"] == "CRITICAL" and e["status"] in ["OPEN","IN_PROGRESS"]])

    # Blocked picks
    blocked_picks = len([p for p in picking if p["status"] == "BLOCKED"])

    # Charts data
    orders_by_status = [
        {"name": "Pending", "value": pending, "color": "#f59e0b"},
        {"name": "Picking", "value": picking_count, "color": "#3b82f6"},
        {"name": "Packing", "value": packing_count, "color": "#8b5cf6"},
        {"name": "QC", "value": qc_count, "color": "#06b6d4"},
        {"name": "Dispatched", "value": dispatched, "color": "#10b981"},
        {"name": "Delivered", "value": delivered, "color": "#6b7280"},
    ]

    orders_by_priority = [
        {"name": "Critical", "value": len([o for o in orders if o["priority"] == "CRITICAL"]), "color": "#ef4444"},
        {"name": "High", "value": len([o for o in orders if o["priority"] == "HIGH"]), "color": "#f97316"},
        {"name": "Medium", "value": len([o for o in orders if o["priority"] == "MEDIUM"]), "color": "#eab308"},
        {"name": "Low", "value": len([o for o in orders if o["priority"] == "LOW"]), "color": "#6b7280"},
    ]

    inventory_health = [
        {"name": "Healthy", "value": inv_healthy, "color": "#10b981"},
        {"name": "Low Stock", "value": inv_low, "color": "#f59e0b"},
        {"name": "Critical", "value": inv_critical, "color": "#f97316"},
        {"name": "Out of Stock", "value": inv_oos, "color": "#ef4444"},
        {"name": "Overstock", "value": inv_overstock, "color": "#6b7280"},
    ]

    # Daily fulfillment trend (last 7 days simulated)
    daily_trend = []
    for day in range(6, -1, -1):
        d = datetime.utcnow() - timedelta(days=day)
        daily_trend.append({
            "date": d.strftime("%b %d"),
            "fulfilled": max(2, 12 - day + (day % 3)),
            "created": max(3, 14 - day + (day % 2)),
        })

    # Top fast-moving products
    fast_movers = sorted(inventory, key=lambda x: x.get("avg_daily_demand", 0), reverse=True)[:5]
    fast_moving = [{"sku": i["sku"], "name": i["product_name"], "avg_daily": i.get("avg_daily_demand", 0)} for i in fast_movers]

    # AI Alerts
    alerts = build_ai_alerts(orders, inventory, exceptions, picking, blocked_picks)

    # Unread notifications
    unread_count = len([n for n in notifications if not n.get("read", True)])

    # Zone performance
    zone_perf = [
        {"zone": "Zone A", "efficiency": 92, "tasks": 8, "blocked": 0},
        {"zone": "Zone B", "efficiency": 71, "tasks": 12, "blocked": 2},
        {"zone": "Zone C", "efficiency": 88, "tasks": 7, "blocked": 0},
        {"zone": "Zone D", "efficiency": 65, "tasks": 5, "blocked": 1},
        {"zone": "Zone E", "efficiency": 95, "tasks": 4, "blocked": 0},
    ]

    return {
        "summary": {
            "total_orders": total_orders,
            "pending_orders": pending,
            "picking_orders": picking_count,
            "packing_orders": packing_count,
            "qc_orders": qc_count,
            "dispatched_orders": dispatched,
            "delivered_orders": delivered,
            "at_risk_orders": at_risk,
            "critical_orders": critical_orders,
            "blocked_picking": blocked_picks,
            "open_exceptions": open_exceptions,
            "critical_exceptions": critical_exceptions,
            "fulfillment_rate": fulfillment_rate,
            "avg_fulfillment_hours": 18.4,
        },
        "inventory": {
            "total_skus": len(inventory),
            "healthy": inv_healthy,
            "low_stock": inv_low,
            "critical": inv_critical,
            "out_of_stock": inv_oos,
            "overstock": inv_overstock,
            "total_value": round(total_inv_value, 2),
        },
        "charts": {
            "orders_by_status": orders_by_status,
            "orders_by_priority": orders_by_priority,
            "inventory_health": inventory_health,
            "daily_trend": daily_trend,
            "zone_performance": zone_perf,
            "fast_moving_products": fast_moving,
        },
        "alerts": alerts,
        "notifications_unread": unread_count,
    }


def build_ai_alerts(orders, inventory, exceptions, picking, blocked_picks):
    alerts = []

    # Alert 1: Critical orders with inventory issues
    crit_short = [o for o in orders if o.get("priority") == "CRITICAL" and o.get("allocation_status") in ["PARTIALLY_ALLOCATED","BACKORDER"] and o.get("status") not in ["DISPATCHED","DELIVERED"]]
    if crit_short:
        alerts.append({
            "id": "A001",
            "severity": "CRITICAL",
            "title": f"{len(crit_short)} CRITICAL order(s) at risk due to insufficient inventory",
            "description": f"Orders {', '.join(o['order_id'] for o in crit_short[:3])} cannot be fully fulfilled.",
            "recommended_action": "Run Allocation Engine to reallocate from lower-priority orders",
            "reason": "Inventory shortage detected for CRITICAL priority orders with imminent SLA deadlines",
            "order_ids": [o["order_id"] for o in crit_short],
            "action_route": "/orders",
        })

    # Alert 2: Out of stock items
    oos = [i for i in inventory if i["status"] == "OUT_OF_STOCK"]
    if oos:
        alerts.append({
            "id": "A002",
            "severity": "CRITICAL",
            "title": f"{len(oos)} SKU(s) are completely OUT OF STOCK",
            "description": f"SKUs {', '.join(i['sku'] for i in oos[:3])} have zero inventory. Orders blocked.",
            "recommended_action": "Issue emergency purchase orders immediately",
            "reason": "Zero inventory cannot fulfill any orders. Immediate replenishment needed.",
            "skus": [i["sku"] for i in oos],
            "action_route": "/inventory",
        })

    # Alert 3: Picking blocked
    if blocked_picks > 0:
        alerts.append({
            "id": "A003",
            "severity": "HIGH",
            "title": f"{blocked_picks} picking task(s) are BLOCKED",
            "description": "Picking tasks cannot proceed due to missing or mislocated items.",
            "recommended_action": "Initiate bin audit and assign supervisory support",
            "reason": "Blocked picking tasks halt the entire fulfillment pipeline and cause SLA risk",
            "action_route": "/picking",
        })

    # Alert 4: Low stock approaching reorder
    low_stock = [i for i in inventory if i["status"] in ["LOW_STOCK", "CRITICAL"]]
    if low_stock:
        alerts.append({
            "id": "A004",
            "severity": "HIGH",
            "title": f"{len(low_stock)} SKU(s) approaching reorder level",
            "description": f"Including {low_stock[0]['product_name']} ({low_stock[0]['quantity_available']} units left)",
            "recommended_action": "Review replenishment recommendations and issue POs",
            "reason": "Stock will deplete below operational minimum within lead time window",
            "action_route": "/inventory",
        })

    # Alert 5: Open critical exceptions
    crit_ex = [e for e in exceptions if e.get("severity") == "CRITICAL" and e.get("status") in ["OPEN","IN_PROGRESS"]]
    if crit_ex:
        alerts.append({
            "id": "A005",
            "severity": "HIGH",
            "title": f"{len(crit_ex)} critical exception(s) require immediate resolution",
            "description": crit_ex[0].get("description", "Critical warehouse exceptions detected"),
            "recommended_action": "Open Exception Center and resolve critical issues first",
            "reason": "Unresolved critical exceptions escalate into SLA breaches and customer complaints",
            "action_route": "/exceptions",
        })

    # Alert 6: Zone B bottleneck
    alerts.append({
        "id": "A006",
        "severity": "MEDIUM",
        "title": "Picking Zone B is causing 28% of today's fulfillment delay",
        "description": "Zone B has 2 blocked tasks and lowest efficiency (71%). High-priority orders assigned here.",
        "recommended_action": "Reassign additional picker to Zone B. Investigate bin availability.",
        "reason": "Zone B concentration of high-priority orders with understaffed picking team",
        "action_route": "/analytics",
    })

    return alerts[:6]
