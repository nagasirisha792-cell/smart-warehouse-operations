"""
WareMind AI – Inventory Allocation Engine
Intelligently allocates stock across competing orders by priority.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid


class AllocationEngine:

    def allocate_order(self, order: Dict, inventory: List[Dict], all_orders: List[Dict]) -> Dict[str, Any]:
        """
        Performs smart allocation for a single order.
        Returns detailed allocation decision with explanations.
        """
        results = []
        overall_status = "FULLY_ALLOCATED"
        total_shortage = 0
        affected_orders = []
        decision_log = []

        for item in order.get("items", []):
            sku = item["sku"]
            qty_needed = item["quantity_ordered"]

            # Find inventory record
            inv = next((i for i in inventory if i["sku"] == sku), None)
            if not inv:
                results.append({
                    "sku": sku,
                    "product_name": item.get("product_name", sku),
                    "required": qty_needed,
                    "available": 0,
                    "reserved_by_others": 0,
                    "allocated": 0,
                    "shortage": qty_needed,
                    "status": "BACKORDER",
                    "reason": "SKU not found in inventory",
                })
                overall_status = "BACKORDER"
                total_shortage += qty_needed
                continue

            qty_available = inv.get("quantity_available", 0)
            qty_reserved = inv.get("quantity_reserved", 0)

            # Find competing orders for this SKU
            competing = []
            for o in all_orders:
                if o["order_id"] == order["order_id"]:
                    continue
                for oi in o.get("items", []):
                    if oi["sku"] == sku and o.get("status") in ["PENDING", "PICKING"]:
                        competing.append({
                            "order_id": o["order_id"],
                            "customer": o.get("customer_name", ""),
                            "priority_score": o.get("priority_score", 0),
                            "priority": o.get("priority", "LOW"),
                            "qty_needed": oi["quantity_ordered"],
                        })

            # Sort competitors by priority
            competing_sorted = sorted(competing, key=lambda x: x["priority_score"], reverse=True)
            current_priority = order.get("priority_score", 50)

            # Calculate truly available stock (not reserved for higher-priority orders)
            reserved_for_higher = sum(
                c["qty_needed"] for c in competing_sorted if c["priority_score"] > current_priority
            )
            actually_available = max(0, qty_available - reserved_for_higher)

            if actually_available >= qty_needed:
                allocated = qty_needed
                status = "FULLY_ALLOCATED"
                shortage = 0
                reason = f"Full allocation: {qty_needed} units available in inventory."
            elif actually_available > 0:
                allocated = actually_available
                shortage = qty_needed - allocated
                status = "PARTIALLY_ALLOCATED"
                overall_status = "PARTIALLY_ALLOCATED"
                total_shortage += shortage
                reason = (
                    f"Partial allocation: {allocated} of {qty_needed} units allocated. "
                    f"{shortage} units short."
                )
                if reserved_for_higher > 0:
                    reason += f" {reserved_for_higher} units reserved for higher-priority orders."
                    affected = [c["order_id"] for c in competing_sorted if c["priority_score"] > current_priority]
                    affected_orders.extend(affected)
            else:
                allocated = 0
                shortage = qty_needed
                status = "BACKORDER"
                if overall_status == "FULLY_ALLOCATED":
                    overall_status = "BACKORDER"
                total_shortage += shortage
                if qty_available == 0:
                    reason = f"OUT OF STOCK: SKU {sku} has zero inventory."
                else:
                    reason = f"All {qty_available} units reserved for higher-priority orders."

            decision_log.append({
                "sku": sku,
                "decision": f"{status}: Allocated {allocated}/{qty_needed}",
                "reason": reason,
                "competing_orders": len(competing),
            })

            results.append({
                "sku": sku,
                "product_name": item.get("product_name", sku),
                "required": qty_needed,
                "available": qty_available,
                "reserved_by_others": reserved_for_higher,
                "allocated": allocated,
                "shortage": shortage,
                "status": status,
                "competing_orders": competing_sorted[:3],
                "reason": reason,
            })

        # Build recommendation
        recommendation = self._build_recommendation(order, results, overall_status, total_shortage, affected_orders)

        return {
            "order_id": order["order_id"],
            "overall_status": overall_status,
            "item_allocations": results,
            "total_shortage": total_shortage,
            "affected_orders": list(set(affected_orders)),
            "recommendation": recommendation,
            "decision_log": decision_log,
            "decision_id": f"DL-{str(uuid.uuid4())[:8].upper()}",
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _build_recommendation(
        self, order: Dict, results: List, status: str, shortage: int, affected: List
    ) -> Dict[str, Any]:
        priority = order.get("priority", "LOW")
        oid = order["order_id"]

        if status == "FULLY_ALLOCATED":
            return {
                "action": "PROCEED",
                "title": "Full allocation successful – ready for picking",
                "description": f"All items for {oid} have been fully allocated. Proceed to picking assignment.",
                "urgency": "LOW",
                "steps": [
                    f"Assign picker to order {oid}",
                    "Generate picking list",
                    "Update inventory reservation",
                ],
            }
        elif status == "PARTIALLY_ALLOCATED":
            if priority in ["CRITICAL", "HIGH"]:
                return {
                    "action": "PARTIAL_FULFILL_AND_BACKORDER",
                    "title": f"Partial fulfillment recommended – {shortage} units on backorder",
                    "description": (
                        f"Allocate all available stock to {oid} ({priority} priority). "
                        f"Place {shortage} units on backorder. "
                        f"Notify customer and initiate replenishment."
                    ),
                    "urgency": "HIGH",
                    "steps": [
                        f"Allocate available units to {oid}",
                        f"Place {shortage} units on backorder",
                        "Trigger replenishment recommendation",
                        "Send customer notification",
                        "Review affected lower-priority orders",
                    ],
                    "affected_orders": affected,
                }
            else:
                return {
                    "action": "HOLD_FOR_REPLENISHMENT",
                    "title": f"Hold order until replenishment – {shortage} units short",
                    "description": (
                        f"Hold {oid} ({priority} priority) until stock replenished. "
                        f"Consider partial fulfillment if customer agrees."
                    ),
                    "urgency": "MEDIUM",
                    "steps": [
                        "Send customer notification",
                        "Wait for replenishment",
                        "Reallocate upon stock arrival",
                    ],
                }
        else:
            return {
                "action": "BACKORDER",
                "title": "Cannot fulfill – initiating backorder",
                "description": (
                    f"No stock available for {oid}. Full backorder initiated. "
                    f"Emergency replenishment recommended for CRITICAL orders."
                ),
                "urgency": "CRITICAL" if priority in ["CRITICAL", "HIGH"] else "MEDIUM",
                "steps": [
                    "Place full backorder",
                    "Contact supplier for emergency PO",
                    "Notify customer of delay",
                    "Review substitute products",
                ],
            }
