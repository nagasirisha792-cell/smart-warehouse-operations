"""Inventory router."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from database.mock_db import get_collection, find_one, update_one
from engines.replenishment_engine import ReplenishmentEngine
from datetime import datetime

router = APIRouter(prefix="/api/inventory", tags=["inventory"])
replenishment = ReplenishmentEngine()


@router.get("")
def list_inventory(
    status: Optional[str] = None,
    category: Optional[str] = None,
    zone: Optional[str] = None,
    search: Optional[str] = None,
):
    inventory = get_collection("inventory")

    if status:
        inventory = [i for i in inventory if i["status"].upper() == status.upper()]
    if category:
        inventory = [i for i in inventory if i.get("category", "").lower() == category.lower()]
    if zone:
        inventory = [i for i in inventory if i.get("zone", "") == zone]
    if search:
        s = search.lower()
        inventory = [i for i in inventory if s in i["sku"].lower() or s in i.get("product_name", "").lower()]

    return {"inventory": inventory, "total": len(inventory)}


@router.get("/stats")
def inventory_stats():
    inventory = get_collection("inventory")
    total_value = sum(i.get("quantity_available", 0) * i.get("unit_price", 0) for i in inventory)
    return {
        "total_skus": len(inventory),
        "healthy": len([i for i in inventory if i["status"] == "HEALTHY"]),
        "low_stock": len([i for i in inventory if i["status"] == "LOW_STOCK"]),
        "critical": len([i for i in inventory if i["status"] == "CRITICAL"]),
        "out_of_stock": len([i for i in inventory if i["status"] == "OUT_OF_STOCK"]),
        "overstock": len([i for i in inventory if i["status"] == "OVERSTOCK"]),
        "total_value": round(total_value, 2),
    }


@router.get("/reorder-recommendations")
def reorder_recommendations():
    inventory = get_collection("inventory")
    recs = replenishment.analyze_all(inventory)
    summary = replenishment.get_dashboard_summary(inventory)
    return {"recommendations": recs, "summary": summary}


@router.get("/{sku}")
def get_inventory_item(sku: str):
    item = find_one("inventory", {"sku": sku.upper()})
    if not item:
        raise HTTPException(404, f"SKU {sku} not found")

    # Get movements
    movements = [m for m in get_collection("inventory_movements") if m["sku"] == sku.upper()]
    movements = sorted(movements, key=lambda x: x["timestamp"], reverse=True)[:20]

    # Get replenishment recommendation
    rec = replenishment.analyze_sku(item)

    return {
        **item,
        "movements": movements,
        "replenishment_recommendation": rec,
    }


@router.post("/{sku}/adjust")
def adjust_inventory(sku: str, body: dict):
    """Adjust inventory quantity."""
    item = find_one("inventory", {"sku": sku.upper()})
    if not item:
        raise HTTPException(404, f"SKU {sku} not found")

    delta = body.get("delta", 0)
    reason = body.get("reason", "Manual adjustment")
    new_qty = max(0, item["quantity_available"] + delta)

    # Determine new status
    reorder = item.get("reorder_level", 20)
    if new_qty == 0:
        new_status = "OUT_OF_STOCK"
    elif new_qty <= reorder // 2:
        new_status = "CRITICAL"
    elif new_qty <= reorder:
        new_status = "LOW_STOCK"
    elif new_qty > 200:
        new_status = "OVERSTOCK"
    else:
        new_status = "HEALTHY"

    update_one("inventory", {"sku": sku.upper()}, {
        "quantity_available": new_qty,
        "status": new_status,
        "last_updated": datetime.utcnow().isoformat(),
    })

    return {
        "sku": sku,
        "previous_qty": item["quantity_available"],
        "new_qty": new_qty,
        "new_status": new_status,
        "reason": reason,
    }
