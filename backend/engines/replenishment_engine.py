"""
WareMind AI – Replenishment Recommendation Engine
Analyzes inventory levels and generates smart reorder recommendations.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any


class ReplenishmentEngine:

    SAFETY_BUFFER_DAYS = 2  # Extra buffer beyond lead time

    def analyze_sku(self, inv: Dict) -> Dict[str, Any]:
        """Analyze a single SKU and return replenishment recommendation."""
        sku = inv["sku"]
        current = inv.get("quantity_available", 0)
        reorder_level = inv.get("reorder_level", 20)
        reorder_qty = inv.get("reorder_quantity", 100)
        avg_daily = inv.get("avg_daily_demand", 5.0)
        lead_time = inv.get("lead_time_days", 3)

        if avg_daily <= 0:
            avg_daily = 1.0

        # Days until stockout
        days_until_stockout = current / avg_daily if avg_daily > 0 else 9999

        # Days of stock needed to cover lead time + safety buffer
        coverage_needed = lead_time + self.SAFETY_BUFFER_DAYS
        stock_at_arrival = max(0, current - (avg_daily * lead_time))

        # Stockout risk
        if current == 0:
            risk = "IMMEDIATE"
            risk_score = 100
        elif days_until_stockout < lead_time:
            risk = "CRITICAL"
            risk_score = 90
        elif days_until_stockout < lead_time + self.SAFETY_BUFFER_DAYS:
            risk = "HIGH"
            risk_score = 75
        elif current <= reorder_level:
            risk = "MEDIUM"
            risk_score = 55
        elif current <= reorder_level * 2:
            risk = "LOW"
            risk_score = 30
        else:
            risk = "NONE"
            risk_score = 5

        # Should reorder?
        should_reorder = risk in ["IMMEDIATE", "CRITICAL", "HIGH", "MEDIUM"]

        # Recommended quantity
        if should_reorder:
            # Cover lead time + safety + extra buffer
            demand_during_lead = avg_daily * (lead_time + self.SAFETY_BUFFER_DAYS + 7)
            recommended_qty = max(reorder_qty, round(demand_during_lead - current))
        else:
            recommended_qty = 0

        # Reorder date
        days_to_reorder = max(0, days_until_stockout - lead_time - self.SAFETY_BUFFER_DAYS)
        reorder_date = (datetime.utcnow() + timedelta(days=days_to_reorder)).isoformat()

        # Build reason
        reasons = []
        if current == 0:
            reasons.append("Product is completely out of stock")
        if days_until_stockout < lead_time:
            reasons.append(f"Projected stockout in {days_until_stockout:.1f} days, but supplier lead time is {lead_time} days")
        if current <= reorder_level:
            reasons.append(f"Current stock ({current}) is at or below reorder level ({reorder_level})")
        if avg_daily > 5:
            reasons.append(f"High daily demand ({avg_daily} units/day) accelerates depletion")

        reason_text = ". ".join(reasons) if reasons else "Stock levels are healthy"

        return {
            "sku": sku,
            "product_name": inv.get("product_name", sku),
            "current_stock": current,
            "reorder_level": reorder_level,
            "avg_daily_demand": avg_daily,
            "days_until_stockout": round(days_until_stockout, 1) if days_until_stockout < 9999 else None,
            "lead_time_days": lead_time,
            "stock_at_supplier_arrival": round(stock_at_arrival, 1),
            "stockout_risk": risk,
            "risk_score": risk_score,
            "should_reorder": should_reorder,
            "recommended_quantity": recommended_qty,
            "recommended_reorder_date": reorder_date if should_reorder else None,
            "reason": reason_text,
            "estimated_cost": round(recommended_qty * inv.get("unit_price", 0), 2),
        }

    def analyze_all(self, inventory: List[Dict]) -> List[Dict]:
        """Analyze all SKUs and return sorted recommendations."""
        results = []
        for inv in inventory:
            rec = self.analyze_sku(inv)
            if rec["should_reorder"]:
                results.append(rec)
        return sorted(results, key=lambda x: x["risk_score"], reverse=True)

    def get_dashboard_summary(self, inventory: List[Dict]) -> Dict[str, Any]:
        """Summary of replenishment needs for dashboard."""
        all_recs = [self.analyze_sku(inv) for inv in inventory]
        immediate = [r for r in all_recs if r["stockout_risk"] == "IMMEDIATE"]
        critical = [r for r in all_recs if r["stockout_risk"] == "CRITICAL"]
        high = [r for r in all_recs if r["stockout_risk"] == "HIGH"]
        medium = [r for r in all_recs if r["stockout_risk"] == "MEDIUM"]
        total_cost = sum(r["estimated_cost"] for r in all_recs if r["should_reorder"])

        return {
            "total_skus": len(inventory),
            "immediate_reorder": len(immediate),
            "critical_reorder": len(critical),
            "high_reorder": len(high),
            "medium_reorder": len(medium),
            "total_reorder_cost": round(total_cost, 2),
            "top_urgent": sorted(all_recs, key=lambda x: x["risk_score"], reverse=True)[:5],
        }
