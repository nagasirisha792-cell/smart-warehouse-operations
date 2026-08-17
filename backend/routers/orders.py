"""Orders router – full order lifecycle management."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from database.mock_db import get_collection, find_one, update_one, insert_one
from engines.priority_engine import PriorityEngine
from engines.allocation_engine import AllocationEngine
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/orders", tags=["orders"])
priority_engine = PriorityEngine()
allocation_engine = AllocationEngine()


@router.get("")
def list_orders(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    risk: Optional[str] = None,
    customer: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, le=200),
):
    orders = get_collection("orders")

    if status:
        orders = [o for o in orders if o["status"].upper() == status.upper()]
    if priority:
        orders = [o for o in orders if o["priority"].upper() == priority.upper()]
    if risk:
        orders = [o for o in orders if o.get("risk_level", "").upper() == risk.upper()]
    if customer:
        orders = [o for o in orders if customer.lower() in o.get("customer_name", "").lower()]
    if search:
        s = search.lower()
        orders = [
            o for o in orders
            if s in o["order_id"].lower()
            or s in o.get("customer_name", "").lower()
            or any(s in item.get("sku", "").lower() for item in o.get("items", []))
        ]

    # Sort by priority score desc
    orders = sorted(orders, key=lambda x: x.get("priority_score", 0), reverse=True)
    return {"orders": orders[:limit], "total": len(orders)}


@router.get("/{order_id}")
def get_order(order_id: str):
    order = find_one("orders", {"order_id": order_id.upper()})
    if not order:
        raise HTTPException(404, f"Order {order_id} not found")
    return order


@router.post("/{order_id}/prioritize")
def prioritize_order(order_id: str):
    order = find_one("orders", {"order_id": order_id.upper()})
    if not order:
        raise HTTPException(404, f"Order {order_id} not found")

    result = priority_engine.calculate(order)
    update_one("orders", {"order_id": order_id.upper()}, {
        "priority_score": result["priority_score"],
        "priority": result["priority"],
        "priority_reasons": result["reasons"],
        "updated_at": datetime.utcnow().isoformat(),
    })

    # Log decision
    insert_one("decision_logs", {
        "_id": str(uuid.uuid4()),
        "decision_type": "PRIORITY_CALCULATION",
        "timestamp": datetime.utcnow().isoformat(),
        "input_data": {"order_id": order_id},
        "decision": f"Classified as {result['priority']} (Score: {result['priority_score']})",
        "reason": result["explanation"],
        "affected_entities": [order_id],
        "recommended_action": "Update picking queue according to new priority",
    })

    return {
        "order_id": order_id,
        "priority_score": result["priority_score"],
        "priority": result["priority"],
        "reasons": result["reasons"],
        "explanation": result["explanation"],
    }


@router.post("/{order_id}/allocate")
def allocate_order(order_id: str):
    order = find_one("orders", {"order_id": order_id.upper()})
    if not order:
        raise HTTPException(404, f"Order {order_id} not found")

    inventory = get_collection("inventory")
    all_orders = get_collection("orders")

    result = allocation_engine.allocate_order(order, inventory, all_orders)

    # Update order allocation status
    update_one("orders", {"order_id": order_id.upper()}, {
        "allocation_status": result["overall_status"],
        "updated_at": datetime.utcnow().isoformat(),
    })

    # Log decision
    insert_one("decision_logs", {
        "_id": str(uuid.uuid4()),
        "decision_type": "INVENTORY_ALLOCATION",
        "timestamp": datetime.utcnow().isoformat(),
        "input_data": {"order_id": order_id, "items": order.get("items", [])},
        "decision": f"Allocation status: {result['overall_status']}",
        "reason": str(result["recommendation"]["description"]),
        "affected_entities": [order_id] + result.get("affected_orders", []),
        "recommended_action": result["recommendation"]["title"],
    })

    return result


@router.post("/{order_id}/advance")
def advance_order_status(order_id: str):
    """Move order to the next stage in the fulfillment pipeline."""
    order = find_one("orders", {"order_id": order_id.upper()})
    if not order:
        raise HTTPException(404, f"Order {order_id} not found")

    flow = ["PENDING", "PICKING", "PACKING", "QC", "DISPATCHED", "DELIVERED"]
    current = order.get("status", "PENDING")
    if current in flow and flow.index(current) < len(flow) - 1:
        next_status = flow[flow.index(current) + 1]
    else:
        raise HTTPException(400, "Order is already at final stage")

    update_one("orders", {"order_id": order_id.upper()}, {
        "status": next_status,
        "updated_at": datetime.utcnow().isoformat(),
    })
    return {"order_id": order_id, "previous_status": current, "new_status": next_status}


@router.post("")
def create_order(order_data: dict):
    """Create a new order with automatic priority calculation."""
    orders = get_collection("orders")
    new_id = f"ORD-{2000 + len(orders)}"

    # Calculate priority
    order_data["order_id"] = new_id
    order_data["created_at"] = datetime.utcnow().isoformat()
    order_data["updated_at"] = datetime.utcnow().isoformat()
    order_data["_id"] = new_id
    order_data["status"] = "PENDING"

    pr = priority_engine.calculate(order_data)
    order_data["priority_score"] = pr["priority_score"]
    order_data["priority"] = pr["priority"]
    order_data["priority_reasons"] = pr["reasons"]

    insert_one("orders", order_data)
    return {"order_id": new_id, "priority": pr["priority"], "priority_score": pr["priority_score"]}


@router.get("/stats/summary")
def order_stats():
    orders = get_collection("orders")
    return {
        "total": len(orders),
        "by_status": {s: len([o for o in orders if o["status"] == s]) for s in ["PENDING","PICKING","PACKING","QC","DISPATCHED","DELIVERED"]},
        "by_priority": {p: len([o for o in orders if o["priority"] == p]) for p in ["CRITICAL","HIGH","MEDIUM","LOW"]},
        "at_risk": len([o for o in orders if o.get("risk_level") == "HIGH"]),
    }
