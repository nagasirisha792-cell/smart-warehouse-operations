"""Picking, Packing, QC, Exceptions, Dispatch, Analytics, Simulation, Copilot routers."""
from fastapi import APIRouter, HTTPException
from typing import Optional
from database.mock_db import get_collection, find_one, update_one, insert_one
from engines.bottleneck_engine import BottleneckEngine
from engines.allocation_engine import AllocationEngine
from engines.priority_engine import PriorityEngine
from engines.replenishment_engine import ReplenishmentEngine
from engines.copilot_engine import CopilotEngine
from datetime import datetime
import uuid

# ─────────────────────────── PICKING ───────────────────────────
picking_router = APIRouter(prefix="/api/picking", tags=["picking"])

@picking_router.get("")
def list_picking():
    tasks = get_collection("picking_tasks")
    tasks = sorted(tasks, key=lambda x: {"CRITICAL":0,"HIGH":1,"MEDIUM":2,"LOW":3}.get(x.get("priority","LOW"),3))
    return {"tasks": tasks, "total": len(tasks)}

@picking_router.post("/{task_id}/complete")
def complete_picking(task_id: str):
    task = find_one("picking_tasks", {"task_id": task_id})
    if not task:
        raise HTTPException(404, "Task not found")
    update_one("picking_tasks", {"task_id": task_id}, {
        "status": "COMPLETED",
        "actual_time_min": task.get("estimated_time_min", 15) + 3,
        "completed_at": datetime.utcnow().isoformat(),
    })
    update_one("orders", {"order_id": task["order_id"]}, {"status": "PACKING", "updated_at": datetime.utcnow().isoformat()})
    return {"task_id": task_id, "status": "COMPLETED"}

@picking_router.post("/{task_id}/start")
def start_picking(task_id: str):
    update_one("picking_tasks", {"task_id": task_id}, {
        "status": "PICKING",
        "started_at": datetime.utcnow().isoformat(),
    })
    return {"task_id": task_id, "status": "PICKING"}

@picking_router.post("/{task_id}/block")
def block_picking(task_id: str, body: dict):
    update_one("picking_tasks", {"task_id": task_id}, {
        "status": "BLOCKED",
        "blocked_reason": body.get("reason", "Item not found at bin location"),
    })
    return {"task_id": task_id, "status": "BLOCKED"}


# ─────────────────────────── PACKING ───────────────────────────
packing_router = APIRouter(prefix="/api/packing", tags=["packing"])

@packing_router.get("")
def list_packing():
    tasks = get_collection("packing_tasks")
    return {"tasks": tasks, "total": len(tasks)}

@packing_router.post("/{task_id}/complete")
def complete_packing(task_id: str):
    task = find_one("packing_tasks", {"task_id": task_id})
    if not task:
        raise HTTPException(404, "Task not found")
    update_one("packing_tasks", {"task_id": task_id}, {
        "status": "COMPLETED",
        "completed_at": datetime.utcnow().isoformat(),
    })
    update_one("orders", {"order_id": task["order_id"]}, {"status": "QC", "updated_at": datetime.utcnow().isoformat()})
    return {"task_id": task_id, "status": "COMPLETED"}

@packing_router.post("/{task_id}/report-damaged")
def report_damaged(task_id: str, body: dict):
    task = find_one("packing_tasks", {"task_id": task_id})
    if not task:
        raise HTTPException(404, "Task not found")
    
    # Create exception
    ex_id = f"EX-AUTO-{str(uuid.uuid4())[:6].upper()}"
    insert_one("exceptions", {
        "_id": ex_id,
        "exception_id": ex_id,
        "type": "DAMAGED_ITEM",
        "severity": "HIGH",
        "order_id": task["order_id"],
        "sku": body.get("sku"),
        "description": body.get("description", f"Damaged item reported during packing of {task['order_id']}"),
        "system_decision": "Remove damaged units from available inventory. Seek replacement.",
        "recommended_action": "Replace damaged units from alternate bin or replenishment.",
        "business_impact": "Packing delayed. QC will flag this order.",
        "resolution_options": ["REPLACE_ITEM", "PARTIAL_FULFILLMENT", "HOLD_ORDER"],
        "status": "OPEN",
        "detected_at": datetime.utcnow().isoformat(),
        "resolution_notes": None,
        "resolved_at": None,
        "assigned_to": "Warehouse Manager",
    })
    return {"task_id": task_id, "exception_id": ex_id, "status": "EXCEPTION_CREATED"}


# ─────────────────────────── QC ────────────────────────────────
qc_router = APIRouter(prefix="/api/qc", tags=["qc"])

@qc_router.get("")
def list_qc():
    checks = get_collection("quality_checks")
    return {"checks": checks, "total": len(checks)}

@qc_router.post("/{qc_id}/pass")
def pass_qc(qc_id: str):
    update_one("quality_checks", {"qc_id": qc_id}, {"status": "PASSED", "checked_at": datetime.utcnow().isoformat()})
    qc = find_one("quality_checks", {"qc_id": qc_id})
    if qc:
        update_one("orders", {"order_id": qc["order_id"]}, {"status": "DISPATCHED", "updated_at": datetime.utcnow().isoformat()})
    return {"qc_id": qc_id, "status": "PASSED"}

@qc_router.post("/{qc_id}/fail")
def fail_qc(qc_id: str, body: dict):
    reason = body.get("reason", "QC check failed")
    update_one("quality_checks", {"qc_id": qc_id}, {"status": "FAILED", "failure_reason": reason})
    qc = find_one("quality_checks", {"qc_id": qc_id})
    if qc:
        ex_id = f"EX-QC-{str(uuid.uuid4())[:6].upper()}"
        insert_one("exceptions", {
            "_id": ex_id,
            "exception_id": ex_id,
            "type": "QC_FAILURE",
            "severity": "HIGH",
            "order_id": qc["order_id"],
            "sku": None,
            "description": reason,
            "system_decision": "Hold order. Return to packing for correction.",
            "recommended_action": "Investigate and correct packing errors. Re-inspect before dispatch.",
            "business_impact": "Dispatch delayed until QC resolved.",
            "resolution_options": ["REPACK", "PARTIAL_DISPATCH", "CANCEL"],
            "status": "OPEN",
            "detected_at": datetime.utcnow().isoformat(),
            "resolution_notes": None,
            "resolved_at": None,
            "assigned_to": "Quality Inspector",
        })
    return {"qc_id": qc_id, "status": "FAILED", "exception_id": ex_id if qc else None}


# ─────────────────────────── EXCEPTIONS ────────────────────────
exceptions_router = APIRouter(prefix="/api/exceptions", tags=["exceptions"])

@exceptions_router.get("")
def list_exceptions(status: Optional[str] = None, severity: Optional[str] = None, type: Optional[str] = None):
    exceptions = get_collection("exceptions")
    if status:
        exceptions = [e for e in exceptions if e.get("status", "").upper() == status.upper()]
    if severity:
        exceptions = [e for e in exceptions if e.get("severity", "").upper() == severity.upper()]
    if type:
        exceptions = [e for e in exceptions if e.get("type", "").upper() == type.upper()]
    
    sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    exceptions = sorted(exceptions, key=lambda x: (sev_order.get(x.get("severity","LOW"),3), x.get("detected_at","")))
    return {"exceptions": exceptions, "total": len(exceptions)}

@exceptions_router.get("/stats")
def exception_stats():
    exceptions = get_collection("exceptions")
    return {
        "total": len(exceptions),
        "open": len([e for e in exceptions if e["status"] == "OPEN"]),
        "in_progress": len([e for e in exceptions if e["status"] == "IN_PROGRESS"]),
        "resolved": len([e for e in exceptions if e["status"] == "RESOLVED"]),
        "critical": len([e for e in exceptions if e["severity"] == "CRITICAL"]),
        "by_type": {t: len([e for e in exceptions if e.get("type") == t]) for t in ["STOCK_SHORTAGE","DAMAGED_ITEM","QC_FAILURE","PICKING_DELAY","DISPATCH_DELAY","MISSING_ITEM","WRONG_SKU","WRONG_QUANTITY","PACKING_DELAY"]},
    }

@exceptions_router.post("/{exception_id}/resolve")
def resolve_exception(exception_id: str, body: dict):
    ex = find_one("exceptions", {"exception_id": exception_id})
    if not ex:
        raise HTTPException(404, "Exception not found")
    update_one("exceptions", {"exception_id": exception_id}, {
        "status": "RESOLVED",
        "resolution_notes": body.get("notes", "Resolved by operator"),
        "resolved_at": datetime.utcnow().isoformat(),
        "resolved_by": body.get("resolved_by", "Warehouse Manager"),
    })
    return {"exception_id": exception_id, "status": "RESOLVED"}

@exceptions_router.post("/{exception_id}/assign")
def assign_exception(exception_id: str, body: dict):
    update_one("exceptions", {"exception_id": exception_id}, {
        "status": "IN_PROGRESS",
        "assigned_to": body.get("assigned_to", "Warehouse Manager"),
    })
    return {"exception_id": exception_id, "status": "IN_PROGRESS"}


# ─────────────────────────── DISPATCH ──────────────────────────
dispatch_router = APIRouter(prefix="/api/dispatch", tags=["dispatch"])

@dispatch_router.get("")
def list_dispatches():
    dispatches = get_collection("dispatches")
    return {"dispatches": dispatches, "total": len(dispatches)}

@dispatch_router.post("/{dispatch_id}/dispatch")
def mark_dispatched(dispatch_id: str):
    update_one("dispatches", {"dispatch_id": dispatch_id}, {
        "status": "DISPATCHED",
        "dispatched_at": datetime.utcnow().isoformat(),
    })
    return {"dispatch_id": dispatch_id, "status": "DISPATCHED"}


# ─────────────────────────── ANALYTICS ─────────────────────────
analytics_router = APIRouter(prefix="/api/analytics", tags=["analytics"])
bottleneck_engine = BottleneckEngine()

@analytics_router.get("")
def get_analytics():
    picking = get_collection("picking_tasks")
    packing = get_collection("packing_tasks")
    qc = get_collection("quality_checks")
    orders = get_collection("orders")
    exceptions = get_collection("exceptions")
    inventory = get_collection("inventory")

    analysis = bottleneck_engine.analyze(picking, packing, qc)

    # Picker productivity
    picker_stats = {}
    for task in picking:
        name = task.get("picker_name", "Unknown")
        if name not in picker_stats:
            picker_stats[name] = {"completed": 0, "total_time": 0, "blocked": 0}
        if task["status"] == "COMPLETED":
            picker_stats[name]["completed"] += 1
            picker_stats[name]["total_time"] += task.get("actual_time_min", 15) or 15
        elif task["status"] == "BLOCKED":
            picker_stats[name]["blocked"] += 1

    picker_productivity = [
        {
            "name": name,
            "completed_tasks": data["completed"],
            "avg_time": round(data["total_time"] / max(1, data["completed"]), 1),
            "blocked_tasks": data["blocked"],
            "efficiency": min(100, max(0, 100 - data["blocked"] * 20)),
        }
        for name, data in picker_stats.items()
    ]

    # Exception trend
    ex_by_type = {}
    for e in exceptions:
        t = e.get("type", "OTHER")
        ex_by_type[t] = ex_by_type.get(t, 0) + 1

    exception_trend = [{"type": k, "count": v} for k, v in sorted(ex_by_type.items(), key=lambda x: -x[1])]

    # Fulfillment time by status
    status_times = [
        {"stage": "Picking", "avg_min": analysis["stage_analysis"]["PICKING"]["avg_time_min"], "benchmark": 8},
        {"stage": "Packing", "avg_min": analysis["stage_analysis"]["PACKING"]["avg_time_min"], "benchmark": 5},
        {"stage": "QC", "avg_min": analysis["stage_analysis"]["QC"]["avg_time_min"], "benchmark": 3},
        {"stage": "Dispatch", "avg_min": analysis["stage_analysis"]["DISPATCH"]["avg_time_min"], "benchmark": 2},
    ]

    return {
        "bottleneck": analysis,
        "picker_productivity": picker_productivity,
        "exception_trend": exception_trend,
        "stage_times": status_times,
        "total_orders_processed": len([o for o in orders if o["status"] in ["DISPATCHED","DELIVERED"]]),
        "avg_fulfillment_hours": 18.4,
        "orders_per_hour": analysis["throughput_per_hour"],
        "fulfillment_efficiency": analysis["fulfillment_efficiency"],
    }

@analytics_router.get("/decisions")
def get_decision_logs():
    logs = get_collection("decision_logs")
    return {"logs": sorted(logs, key=lambda x: x.get("timestamp",""), reverse=True), "total": len(logs)}


# ─────────────────────────── NOTIFICATIONS ─────────────────────
notifications_router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@notifications_router.get("")
def list_notifications():
    notifs = get_collection("notifications")
    notifs = sorted(notifs, key=lambda x: x.get("created_at",""), reverse=True)
    return {
        "notifications": notifs,
        "unread_count": len([n for n in notifs if not n.get("read", True)]),
    }

@notifications_router.post("/{notif_id}/read")
def mark_read(notif_id: str):
    update_one("notifications", {"_id": notif_id}, {"read": True})
    return {"id": notif_id, "read": True}

@notifications_router.post("/read-all")
def mark_all_read():
    for n in get_collection("notifications"):
        update_one("notifications", {"_id": n["_id"]}, {"read": True})
    return {"message": "All notifications marked as read"}


# ─────────────────────────── SIMULATION ────────────────────────
simulation_router = APIRouter(prefix="/api/simulation", tags=["simulation"])
alloc_engine_sim = AllocationEngine()
priority_engine_sim = PriorityEngine()
replenishment_sim = ReplenishmentEngine()

@simulation_router.post("/stock-shortage")
def simulate_stock_shortage(body: dict):
    """Simulate a sudden stock shortage for a SKU and trigger cascading decisions."""
    sku = body.get("sku", "SKU-104")
    reduce_by = body.get("reduce_by", 20)

    item = find_one("inventory", {"sku": sku.upper()})
    if not item:
        raise HTTPException(404, f"SKU {sku} not found")

    old_qty = item["quantity_available"]
    new_qty = max(0, old_qty - reduce_by)
    reorder = item.get("reorder_level", 20)

    new_status = "OUT_OF_STOCK" if new_qty == 0 else "CRITICAL" if new_qty <= reorder // 2 else "LOW_STOCK" if new_qty <= reorder else "HEALTHY"

    update_one("inventory", {"sku": sku.upper()}, {
        "quantity_available": new_qty,
        "status": new_status,
        "last_updated": datetime.utcnow().isoformat(),
    })

    # Find affected orders
    all_orders = get_collection("orders")
    affected = [
        o for o in all_orders
        if any(item["sku"] == sku.upper() for item in o.get("items",[]))
        and o["status"] in ["PENDING","PICKING"]
    ]

    # Recalculate allocations for affected orders
    inventory = get_collection("inventory")
    allocation_results = []
    for order in sorted(affected, key=lambda x: x.get("priority_score",0), reverse=True):
        result = alloc_engine_sim.allocate_order(order, inventory, all_orders)
        allocation_results.append({
            "order_id": order["order_id"],
            "priority": order["priority"],
            "allocation_status": result["overall_status"],
            "recommendation": result["recommendation"],
        })
        update_one("orders", {"order_id": order["order_id"]}, {
            "allocation_status": result["overall_status"],
            "inventory_status": "PARTIAL" if result["overall_status"] != "FULLY_ALLOCATED" else order.get("inventory_status","AVAILABLE"),
            "updated_at": datetime.utcnow().isoformat(),
        })

    # Create replenishment recommendation
    updated_item = find_one("inventory", {"sku": sku.upper()})
    replenishment_rec = replenishment_sim.analyze_sku(updated_item) if updated_item else {}

    # Create exception
    ex_id = f"EX-SIM-{str(uuid.uuid4())[:6].upper()}"
    insert_one("exceptions", {
        "_id": ex_id,
        "exception_id": ex_id,
        "type": "STOCK_SHORTAGE",
        "severity": "CRITICAL" if new_qty == 0 else "HIGH",
        "order_id": affected[0]["order_id"] if affected else None,
        "sku": sku.upper(),
        "description": f"[SIMULATION] Stock shortage: {sku} reduced by {reduce_by} units. New stock: {new_qty}.",
        "system_decision": f"Reallocated stock to {len(affected)} affected orders by priority.",
        "recommended_action": f"Reorder {replenishment_rec.get('recommended_quantity', 100)} units immediately.",
        "business_impact": f"{len(affected)} order(s) affected. Potential fulfillment delay.",
        "resolution_options": ["EMERGENCY_REPLENISHMENT", "PRIORITY_ALLOCATION", "NOTIFY_CUSTOMERS"],
        "status": "OPEN",
        "detected_at": datetime.utcnow().isoformat(),
        "resolution_notes": None,
        "resolved_at": None,
        "assigned_to": "Warehouse Manager",
    })

    # Add notification
    insert_one("notifications", {
        "_id": f"SIM-N-{str(uuid.uuid4())[:6]}",
        "type": "STOCK_SHORTAGE",
        "severity": "CRITICAL",
        "title": f"[SIMULATION] Stock Shortage: {sku}",
        "message": f"Stock reduced by {reduce_by} units to {new_qty}. {len(affected)} orders affected.",
        "read": False,
        "created_at": datetime.utcnow().isoformat(),
    })

    return {
        "simulation": "STOCK_SHORTAGE",
        "sku": sku.upper(),
        "previous_quantity": old_qty,
        "new_quantity": new_qty,
        "new_status": new_status,
        "affected_orders": len(affected),
        "allocation_results": allocation_results,
        "replenishment_recommendation": replenishment_rec,
        "exception_id": ex_id,
        "notifications_created": 1,
        "system_response": f"Detected shortage in {sku}. Reallocated stock to {len(affected)} orders by priority score. Exception created. Replenishment triggered.",
    }


@simulation_router.post("/urgent-order")
def simulate_urgent_order(body: dict):
    """Create an urgent order and trigger priority/allocation cascade."""
    orders = get_collection("orders")
    new_id = f"ORD-SIM-{str(uuid.uuid4())[:6].upper()}"
    
    customer = body.get("customer", "Apex Manufacturing Co.")
    sku = body.get("sku", "SKU-106")
    qty = body.get("quantity", 10)

    prod = find_one("inventory", {"sku": sku.upper()})
    prod_name = prod.get("product_name", sku) if prod else sku

    now = datetime.utcnow()
    new_order = {
        "_id": new_id,
        "order_id": new_id,
        "customer_id": "C001",
        "customer_name": customer,
        "customer_tier": "ENTERPRISE",
        "order_date": now.isoformat(),
        "items": [{"sku": sku.upper(), "product_name": prod_name, "quantity_ordered": qty, "unit_price": prod.get("unit_price", 50) if prod else 50, "status": "PENDING"}],
        "total_quantity": qty,
        "total_value": qty * (prod.get("unit_price", 50) if prod else 50),
        "status": "PENDING",
        "priority": "CRITICAL",
        "priority_score": 95,
        "shipping_method": "OVERNIGHT",
        "sla_deadline": (now + __import__("datetime").timedelta(hours=4)).isoformat(),
        "expected_dispatch": (now + __import__("datetime").timedelta(hours=2)).isoformat(),
        "assigned_picker": "James Wilson",
        "picker_id": "P001",
        "inventory_status": "PARTIAL" if prod and prod.get("quantity_available", 0) < qty else "AVAILABLE",
        "allocation_status": "PENDING",
        "risk_level": "HIGH",
        "notes": "[SIMULATION] Urgent order – production line at risk",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "timeline": [],
        "priority_reasons": [
            {"factor": "OVERNIGHT shipping", "weight": 25, "impact": "CRITICAL"},
            {"factor": "SLA: 4 hours", "weight": 30, "impact": "CRITICAL"},
            {"factor": "ENTERPRISE customer", "weight": 20, "impact": "HIGH"},
        ],
    }
    insert_one("orders", new_order)

    # Run allocation
    inventory = get_collection("inventory")
    alloc = alloc_engine_sim.allocate_order(new_order, inventory, get_collection("orders"))
    update_one("orders", {"order_id": new_id}, {"allocation_status": alloc["overall_status"]})

    insert_one("notifications", {
        "_id": f"SIM-N-{str(uuid.uuid4())[:6]}",
        "type": "SLA_RISK",
        "severity": "CRITICAL",
        "title": f"[SIMULATION] Urgent Order Created: {new_id}",
        "message": f"CRITICAL order {new_id} from {customer}. SLA: 4 hours. Allocation: {alloc['overall_status']}.",
        "read": False,
        "created_at": now.isoformat(),
    })

    return {
        "simulation": "URGENT_ORDER",
        "order_id": new_id,
        "priority": "CRITICAL",
        "allocation_status": alloc["overall_status"],
        "allocation_detail": alloc,
        "system_response": f"Urgent order {new_id} created and prioritized as CRITICAL. Allocation engine ran automatically. {alloc['recommendation']['title']}",
    }


@simulation_router.post("/damage-item")
def simulate_damage(body: dict):
    """Simulate item damage during picking/packing."""
    sku = body.get("sku", "SKU-102")
    qty_damaged = body.get("quantity", 3)
    order_id = body.get("order_id", "ORD-1004")

    # Reduce inventory
    item = find_one("inventory", {"sku": sku.upper()})
    if item:
        new_qty = max(0, item["quantity_available"] - qty_damaged)
        reorder = item.get("reorder_level", 20)
        new_status = "OUT_OF_STOCK" if new_qty == 0 else "CRITICAL" if new_qty <= reorder//2 else "LOW_STOCK" if new_qty <= reorder else "HEALTHY"
        update_one("inventory", {"sku": sku.upper()}, {"quantity_available": new_qty, "status": new_status, "last_updated": datetime.utcnow().isoformat()})

    ex_id = f"EX-DMG-{str(uuid.uuid4())[:6].upper()}"
    insert_one("exceptions", {
        "_id": ex_id,
        "exception_id": ex_id,
        "type": "DAMAGED_ITEM",
        "severity": "HIGH",
        "order_id": order_id,
        "sku": sku.upper(),
        "description": f"[SIMULATION] {qty_damaged} units of {sku} found damaged. Inventory adjusted.",
        "system_decision": f"Remove {qty_damaged} damaged units from inventory. Reallocate from alternate bin.",
        "recommended_action": "Replace damaged units or partial fulfillment. Issue damage report.",
        "business_impact": f"Inventory reduced by {qty_damaged}. Affected orders may need reallocation.",
        "resolution_options": ["REPLACE_ITEM", "PARTIAL_FULFILLMENT", "HOLD_ORDER"],
        "status": "OPEN",
        "detected_at": datetime.utcnow().isoformat(),
        "resolution_notes": None,
        "resolved_at": None,
        "assigned_to": "Warehouse Manager",
    })

    return {
        "simulation": "DAMAGE_ITEM",
        "sku": sku.upper(),
        "qty_damaged": qty_damaged,
        "exception_id": ex_id,
        "inventory_updated": True,
        "system_response": f"Damage detected: {qty_damaged} units of {sku} marked as damaged. Inventory updated. Exception {ex_id} created. QC notified.",
    }


@simulation_router.post("/delay-order")
def simulate_delay(body: dict):
    """Simulate a picking delay for an order."""
    order_id = body.get("order_id", "ORD-1002")
    order = find_one("orders", {"order_id": order_id.upper()})
    if not order:
        raise HTTPException(404, "Order not found")

    ex_id = f"EX-DLY-{str(uuid.uuid4())[:6].upper()}"
    insert_one("exceptions", {
        "_id": ex_id,
        "exception_id": ex_id,
        "type": "PICKING_DELAY",
        "severity": "HIGH" if order.get("priority") in ["CRITICAL","HIGH"] else "MEDIUM",
        "order_id": order_id.upper(),
        "sku": None,
        "description": f"[SIMULATION] Picking delayed for {order_id}. Picker unavailable or item not found.",
        "system_decision": "Reassign to next available picker. Update SLA risk status.",
        "recommended_action": "Assign backup picker immediately. Notify customer if SLA at risk.",
        "business_impact": f"Potential SLA breach. Order priority: {order.get('priority','N/A')}.",
        "resolution_options": ["REASSIGN_PICKER", "ESCALATE", "NOTIFY_CUSTOMER"],
        "status": "OPEN",
        "detected_at": datetime.utcnow().isoformat(),
        "resolution_notes": None,
        "resolved_at": None,
        "assigned_to": "Warehouse Manager",
    })

    update_one("orders", {"order_id": order_id.upper()}, {
        "risk_level": "HIGH",
        "updated_at": datetime.utcnow().isoformat(),
    })

    return {
        "simulation": "DELAY_ORDER",
        "order_id": order_id.upper(),
        "exception_id": ex_id,
        "risk_level": "HIGH",
        "system_response": f"Delay detected for {order_id}. Risk level elevated to HIGH. Exception {ex_id} raised. Supervisor notified.",
    }


# ─────────────────────────── COPILOT ───────────────────────────
copilot_router = APIRouter(prefix="/api/copilot", tags=["copilot"])
copilot_engine = CopilotEngine()

@copilot_router.post("/query")
def copilot_query(body: dict):
    question = body.get("question", "")
    if not question:
        raise HTTPException(400, "Question is required")

    context = {
        "orders": get_collection("orders"),
        "inventory": get_collection("inventory"),
        "exceptions": get_collection("exceptions"),
        "picking_tasks": get_collection("picking_tasks"),
        "dispatches": get_collection("dispatches"),
    }

    result = copilot_engine.query(question, context)
    return result
