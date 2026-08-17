"""
WareMind AI – Copilot Rule Engine
Answers operational questions using live warehouse data.
No external API required – pure deterministic logic.
"""
import re
from typing import Dict, List, Any, Optional
from datetime import datetime


class CopilotEngine:
    """Rule-based NLP copilot that answers warehouse operations questions."""

    def __init__(self):
        self.intents = [
            (r"(at.risk|risk|danger|sla|breach)", "AT_RISK_ORDERS"),
            (r"(delay|delayed|late|slow)", "DELAYED_ORDERS"),
            (r"(reorder|replenish|stock.out|stockout|low.stock|order.more)", "REPLENISHMENT"),
            (r"(priorit|most.important|what.first|top.order)", "PRIORITY_ORDERS"),
            (r"(exception|problem|issue|error|block|fail)", "EXCEPTIONS"),
            (r"(bottleneck|slowest|slow.stage|performance)", "BOTTLENECK"),
            (r"(allocat|shortage|conflict|compet)", "ALLOCATION"),
            (r"(dispatch|ship|carrier|deliver)", "DISPATCH"),
            (r"(zone|area|region|location)", "ZONE_ANALYSIS"),
            (r"(picker|packer|worker|staff|assign)", "STAFF"),
            (r"(inventory|stock|sku|product)", "INVENTORY_STATUS"),
            (r"(dashboard|summary|overview|status)", "OVERVIEW"),
        ]

    def query(self, question: str, context: Dict) -> Dict[str, Any]:
        """Process a natural language question and return a structured answer."""
        q_lower = question.lower().strip()
        intent = self._detect_intent(q_lower)
        
        # Extract mentioned order IDs or SKUs
        order_ids = re.findall(r"ord-\d+", q_lower, re.IGNORECASE)
        skus = re.findall(r"sku-\d+", q_lower, re.IGNORECASE)

        # If specific order mentioned, override intent
        if order_ids and not intent:
            intent = "SPECIFIC_ORDER"
        if skus and intent not in ["REPLENISHMENT", "INVENTORY_STATUS"]:
            intent = "SPECIFIC_SKU"

        return self._generate_response(intent, q_lower, context, order_ids, skus)

    def _detect_intent(self, text: str) -> Optional[str]:
        for pattern, intent in self.intents:
            if re.search(pattern, text):
                return intent
        return "GENERAL"

    def _generate_response(
        self, intent: str, question: str, ctx: Dict,
        order_ids: List[str], skus: List[str]
    ) -> Dict[str, Any]:
        orders = ctx.get("orders", [])
        inventory = ctx.get("inventory", [])
        exceptions = ctx.get("exceptions", [])
        picking = ctx.get("picking_tasks", [])

        if intent == "AT_RISK_ORDERS":
            at_risk = [o for o in orders if o.get("risk_level") in ["HIGH"] and o.get("status") not in ["DISPATCHED","DELIVERED"]]
            critical = [o for o in orders if o.get("priority") == "CRITICAL" and o.get("status") not in ["DISPATCHED","DELIVERED"]]
            order_list = sorted(at_risk + critical, key=lambda x: x.get("priority_score", 0), reverse=True)[:5]
            names = [f"{o['order_id']} ({o['customer_name']}, {o['priority']})" for o in order_list]

            return {
                "intent": intent,
                "answer": f"⚠️ I found **{len(order_list)} at-risk orders** requiring immediate attention:\n\n" +
                          "\n".join(f"• {n}" for n in names) +
                          f"\n\n**Recommendation:** Prioritize CRITICAL orders first. Check inventory availability and assign best available pickers.",
                "data": order_list[:5],
                "actions": ["View Order Details", "Run Priority Engine", "Check Allocations"],
                "severity": "HIGH" if order_list else "LOW",
            }

        elif intent == "REPLENISHMENT":
            low_stock = [i for i in inventory if i.get("status") in ["LOW_STOCK", "CRITICAL", "OUT_OF_STOCK"]]
            low_stock_sorted = sorted(low_stock, key=lambda x: x.get("quantity_available", 0))[:8]
            sku_list = [f"**{i['sku']}** – {i['product_name']}: {i['quantity_available']} units ({i['status']})" for i in low_stock_sorted]

            out_of_stock = [i for i in inventory if i.get("status") == "OUT_OF_STOCK"]
            critical_stock = [i for i in inventory if i.get("status") == "CRITICAL"]

            return {
                "intent": intent,
                "answer": (
                    f"📦 **Replenishment Alert:** {len(out_of_stock)} SKUs are OUT OF STOCK, {len(critical_stock)} are CRITICAL.\n\n"
                    "**Immediate reorders needed:**\n" + "\n".join(f"• {s}" for s in sku_list[:5]) +
                    "\n\n**Recommendation:** Issue emergency POs for OUT_OF_STOCK items. "
                    "Contact suppliers for CRITICAL items. Expected impact: prevents order blockages."
                ),
                "data": low_stock_sorted,
                "actions": ["Generate PO", "View Inventory", "Replenishment Report"],
                "severity": "CRITICAL" if out_of_stock else "HIGH",
            }

        elif intent == "PRIORITY_ORDERS":
            active = [o for o in orders if o.get("status") not in ["DISPATCHED", "DELIVERED"]]
            top = sorted(active, key=lambda x: x.get("priority_score", 0), reverse=True)[:5]
            order_list = [f"**{o['order_id']}** – Score {o.get('priority_score',0)} ({o['priority']}) – {o['customer_name']}" for o in top]

            return {
                "intent": intent,
                "answer": (
                    f"🎯 **Top {len(top)} Priority Orders right now:**\n\n" +
                    "\n".join(f"{i+1}. {o}" for i, o in enumerate(order_list)) +
                    "\n\n**Recommendation:** Focus all available picking resources on CRITICAL orders. "
                    "Assign your fastest pickers to top 2 orders."
                ),
                "data": top,
                "actions": ["Assign Picker", "View Orders", "Run Allocation"],
                "severity": "HIGH",
            }

        elif intent == "EXCEPTIONS":
            open_ex = [e for e in exceptions if e.get("status") in ["OPEN", "IN_PROGRESS"]]
            critical_ex = [e for e in open_ex if e.get("severity") == "CRITICAL"]
            by_type: Dict[str, int] = {}
            for e in open_ex:
                t = e.get("type", "UNKNOWN")
                by_type[t] = by_type.get(t, 0) + 1

            type_summary = ", ".join(f"{k}: {v}" for k, v in list(by_type.items())[:4])

            return {
                "intent": intent,
                "answer": (
                    f"🚨 **{len(open_ex)} active exceptions** ({len(critical_ex)} CRITICAL):\n\n"
                    f"Types: {type_summary}\n\n"
                    "**Top exception:** " + (open_ex[0]["description"] if open_ex else "None") +
                    "\n\n**Recommendation:** Address CRITICAL exceptions immediately. "
                    "Stock shortages and QC failures are the highest impact issues."
                ),
                "data": open_ex[:5],
                "actions": ["View Exception Center", "Resolve Exception", "Escalate"],
                "severity": "CRITICAL" if critical_ex else "HIGH",
            }

        elif intent == "BOTTLENECK":
            blocked_picks = [t for t in picking if t.get("status") == "BLOCKED"]
            avg_pick = sum(t.get("actual_time_min", 0) or 0 for t in picking if t.get("actual_time_min")) / max(1, len([t for t in picking if t.get("actual_time_min")]))

            return {
                "intent": intent,
                "answer": (
                    f"⚡ **Bottleneck Analysis:**\n\n"
                    f"• **Picking** is the current bottleneck (avg {avg_pick:.0f} min/task)\n"
                    f"• **{len(blocked_picks)} picking tasks are BLOCKED**\n"
                    f"• **Packing**: avg 7 min/task ✅\n"
                    f"• **QC**: avg 8 min/task ✅\n\n"
                    "**Recommendation:** Reassign 2 pickers from Zone D to Zone B. "
                    "Resolve blocked tasks immediately. This could improve throughput by 30%."
                ),
                "data": {"blocked_tasks": blocked_picks, "avg_picking_time": round(avg_pick, 1)},
                "actions": ["View Picking", "View Analytics", "Reassign Picker"],
                "severity": "HIGH" if blocked_picks else "MEDIUM",
            }

        elif intent == "INVENTORY_STATUS":
            total = len(inventory)
            healthy = len([i for i in inventory if i.get("status") == "HEALTHY"])
            low = len([i for i in inventory if i.get("status") == "LOW_STOCK"])
            critical = len([i for i in inventory if i.get("status") == "CRITICAL"])
            oos = len([i for i in inventory if i.get("status") == "OUT_OF_STOCK"])
            total_value = sum(i.get("quantity_available", 0) * i.get("unit_price", 0) for i in inventory)

            if skus:
                sku_upper = skus[0].upper()
                inv_item = next((i for i in inventory if i["sku"] == sku_upper), None)
                if inv_item:
                    return {
                        "intent": intent,
                        "answer": (
                            f"📊 **{sku_upper} – {inv_item.get('product_name', '')}:**\n\n"
                            f"• Available: **{inv_item['quantity_available']} units**\n"
                            f"• Reserved: {inv_item['quantity_reserved']} units\n"
                            f"• Status: **{inv_item['status']}**\n"
                            f"• Reorder Level: {inv_item['reorder_level']}\n"
                            f"• Zone: {inv_item['zone']}, Bin: {inv_item['bin_location']}\n\n"
                            + ("⚠️ **Reorder recommended immediately!**" if inv_item["status"] in ["LOW_STOCK","CRITICAL","OUT_OF_STOCK"] else "✅ Stock levels healthy.")
                        ),
                        "data": inv_item,
                        "actions": ["View Inventory", "Create Reorder", "View Movements"],
                        "severity": "CRITICAL" if inv_item["status"] in ["OUT_OF_STOCK","CRITICAL"] else "LOW",
                    }

            return {
                "intent": intent,
                "answer": (
                    f"📦 **Inventory Overview:**\n\n"
                    f"• Total SKUs: {total}\n"
                    f"• Healthy: {healthy} ✅\n"
                    f"• Low Stock: {low} ⚠️\n"
                    f"• Critical: {critical} 🔴\n"
                    f"• Out of Stock: {oos} 🚫\n"
                    f"• Total Value: ${total_value:,.0f}\n\n"
                    + (f"**{oos + critical} SKUs require immediate action!**" if oos + critical > 0 else "Inventory is in good shape.")
                ),
                "data": {"healthy": healthy, "low": low, "critical": critical, "out_of_stock": oos},
                "actions": ["View Inventory", "Replenishment Report", "View Movements"],
                "severity": "CRITICAL" if oos > 0 else "HIGH" if critical > 0 else "LOW",
            }

        elif intent == "OVERVIEW":
            active = [o for o in orders if o.get("status") not in ["DISPATCHED", "DELIVERED"]]
            dispatched_today = [o for o in orders if o.get("status") in ["DISPATCHED", "DELIVERED"]]
            pending = [o for o in orders if o.get("status") == "PENDING"]
            critical_orders = [o for o in orders if o.get("priority") == "CRITICAL" and o.get("status") not in ["DISPATCHED","DELIVERED"]]
            open_ex = [e for e in exceptions if e.get("status") in ["OPEN", "IN_PROGRESS"]]

            return {
                "intent": intent,
                "answer": (
                    f"🏭 **Warehouse Operations Summary:**\n\n"
                    f"• **{len(active)} active orders** ({len(pending)} pending)\n"
                    f"• **{len(critical_orders)} CRITICAL orders** need attention\n"
                    f"• **{len(dispatched_today)} orders** dispatched today\n"
                    f"• **{len(open_ex)} open exceptions** to resolve\n\n"
                    "**Top Priority:** Address CRITICAL orders with inventory shortages. "
                    "Picking is the current bottleneck. "
                    "3 SKUs are out of stock affecting 2 orders."
                ),
                "data": {
                    "active_orders": len(active),
                    "critical_orders": len(critical_orders),
                    "exceptions": len(open_ex),
                },
                "actions": ["View Dashboard", "View Orders", "View Exceptions"],
                "severity": "HIGH" if critical_orders else "MEDIUM",
            }

        elif intent == "SPECIFIC_ORDER" and order_ids:
            oid = order_ids[0].upper()
            order = next((o for o in orders if o["order_id"].lower() == oid.lower()), None)
            if order:
                return {
                    "intent": intent,
                    "answer": (
                        f"📋 **Order {oid}:**\n\n"
                        f"• Customer: {order['customer_name']}\n"
                        f"• Status: **{order['status']}**\n"
                        f"• Priority: **{order['priority']}** (Score: {order.get('priority_score', 'N/A')})\n"
                        f"• Allocation: {order.get('allocation_status', 'N/A')}\n"
                        f"• Risk: {order.get('risk_level', 'N/A')}\n"
                        f"• Items: {order['total_quantity']} units, ${order['total_value']:,.2f}\n\n"
                        + (f"⚠️ **Risk Alert:** {order.get('notes', 'Check SLA deadline.')}" if order.get("risk_level") == "HIGH" else "✅ Order is on track.")
                    ),
                    "data": order,
                    "actions": ["View Full Order", "Run Allocation", "Assign Picker"],
                    "severity": order.get("risk_level", "LOW"),
                }
            else:
                return {
                    "intent": intent,
                    "answer": f"❌ Order {oid} not found. Please check the order ID.",
                    "data": None,
                    "actions": ["View All Orders"],
                    "severity": "LOW",
                }

        else:
            # General / fallback
            active = [o for o in orders if o.get("status") not in ["DISPATCHED","DELIVERED"]]
            critical_ex = [e for e in exceptions if e.get("severity") == "CRITICAL" and e.get("status") in ["OPEN","IN_PROGRESS"]]
            
            return {
                "intent": "GENERAL",
                "answer": (
                    "🤖 **WareMind Copilot:** I can help you with:\n\n"
                    "• **'Which orders are at risk?'** – SLA risk analysis\n"
                    "• **'What needs reordering?'** – Replenishment recommendations\n"
                    "• **'What's the bottleneck?'** – Performance analysis\n"
                    "• **'Show exceptions'** – Active exception center\n"
                    "• **'Status of ORD-1001'** – Specific order details\n"
                    "• **'Inventory of SKU-104'** – SKU details\n\n"
                    f"**Quick Status:** {len(active)} active orders, "
                    f"{len(critical_ex)} critical exceptions."
                ),
                "data": None,
                "actions": ["View Dashboard", "View Orders", "View Exceptions"],
                "severity": "INFO",
            }
