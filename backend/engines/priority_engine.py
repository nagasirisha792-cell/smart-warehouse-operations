"""
WareMind AI – Priority Decision Engine
Calculates a 0-100 priority score for each order and classifies it.
"""
from datetime import datetime, timezone
from typing import Dict, List, Any


class PriorityEngine:
    WEIGHTS = {
        "shipping_method": 20,
        "sla_deadline": 30,
        "customer_tier": 20,
        "order_age": 10,
        "inventory_availability": 10,
        "order_value": 5,
        "notes_urgency": 5,
    }

    SHIPPING_SCORES = {
        "OVERNIGHT": 1.0,
        "EXPRESS": 0.75,
        "STANDARD": 0.35,
        "FREIGHT": 0.2,
    }

    TIER_SCORES = {
        "ENTERPRISE": 1.0,
        "PREMIUM": 0.75,
        "STANDARD": 0.4,
    }

    def calculate(self, order: Dict) -> Dict[str, Any]:
        reasons = []
        score = 0

        # 1. Shipping method (max 20)
        shipping = order.get("shipping_method", "STANDARD")
        s_score = self.WEIGHTS["shipping_method"] * self.SHIPPING_SCORES.get(shipping, 0.3)
        score += s_score
        if shipping in ["OVERNIGHT", "EXPRESS"]:
            reasons.append({"factor": f"{shipping.title()} shipping selected", "weight": round(s_score), "impact": "HIGH"})

        # 2. SLA deadline (max 30)
        sla_str = order.get("sla_deadline", "")
        if sla_str:
            try:
                sla_dt = datetime.fromisoformat(sla_str)
                now = datetime.utcnow()
                if sla_dt.tzinfo:
                    now = datetime.now(timezone.utc)
                hours_left = (sla_dt - now).total_seconds() / 3600
                if hours_left < 0:
                    sla_factor = 1.0
                    reasons.append({"factor": "SLA BREACHED - overdue", "weight": 30, "impact": "CRITICAL"})
                elif hours_left < 4:
                    sla_factor = 1.0
                    reasons.append({"factor": f"SLA deadline in {hours_left:.1f} hours (CRITICAL)", "weight": 30, "impact": "CRITICAL"})
                elif hours_left < 12:
                    sla_factor = 0.8
                    reasons.append({"factor": f"SLA deadline in {hours_left:.1f} hours", "weight": 24, "impact": "HIGH"})
                elif hours_left < 24:
                    sla_factor = 0.5
                    reasons.append({"factor": f"SLA deadline in {hours_left:.0f} hours", "weight": 15, "impact": "MEDIUM"})
                elif hours_left < 72:
                    sla_factor = 0.25
                    reasons.append({"factor": f"SLA deadline in {hours_left/24:.1f} days", "weight": 8, "impact": "LOW"})
                else:
                    sla_factor = 0.1
            except Exception:
                sla_factor = 0.3
        else:
            sla_factor = 0.3
        sla_score = self.WEIGHTS["sla_deadline"] * sla_factor
        score += sla_score

        # 3. Customer tier (max 20)
        tier = order.get("customer_tier", "STANDARD")
        t_score = self.WEIGHTS["customer_tier"] * self.TIER_SCORES.get(tier, 0.4)
        score += t_score
        if tier in ["ENTERPRISE", "PREMIUM"]:
            reasons.append({"factor": f"{tier.title()} customer account", "weight": round(t_score), "impact": "HIGH" if tier == "ENTERPRISE" else "MEDIUM"})

        # 4. Order age (max 10) – older = higher urgency
        created_str = order.get("created_at", "")
        if created_str:
            try:
                created_dt = datetime.fromisoformat(created_str)
                now = datetime.utcnow()
                age_hours = (now - created_dt).total_seconds() / 3600
                age_factor = min(age_hours / 48, 1.0)
                age_score = self.WEIGHTS["order_age"] * age_factor
                score += age_score
                if age_hours > 24:
                    reasons.append({"factor": f"Order pending {age_hours/24:.1f} days (aging)", "weight": round(age_score), "impact": "MEDIUM"})
            except Exception:
                pass

        # 5. Inventory availability (max 10)
        inv_status = order.get("inventory_status", "AVAILABLE")
        alloc_status = order.get("allocation_status", "FULLY_ALLOCATED")
        if inv_status == "AVAILABLE" and alloc_status == "FULLY_ALLOCATED":
            inv_score = 10
            reasons.append({"factor": "Inventory fully available – ready to pick", "weight": 10, "impact": "POSITIVE"})
        elif alloc_status == "PARTIALLY_ALLOCATED":
            inv_score = 5
            reasons.append({"factor": "Partial inventory – shortage risk", "weight": 5, "impact": "NEGATIVE"})
        else:
            inv_score = 0
            reasons.append({"factor": "No inventory available – blocked", "weight": 0, "impact": "NEGATIVE"})
        score += inv_score

        # 6. Order value (max 5)
        val = order.get("total_value", 0)
        if val > 1000:
            score += 5
            reasons.append({"factor": f"High order value (${val:,.0f})", "weight": 5, "impact": "MEDIUM"})
        elif val > 500:
            score += 3
        else:
            score += 1

        # 7. Notes urgency keywords (max 5)
        notes = (order.get("notes", "") or "").lower()
        urgency_keywords = ["urgent", "shutdown", "emergency", "critical", "deadline", "compliance"]
        if any(kw in notes for kw in urgency_keywords):
            score += 5
            reasons.append({"factor": f"Operational urgency: {order.get('notes','')[:50]}", "weight": 5, "impact": "HIGH"})

        final_score = min(100, round(score))

        # Classify
        if final_score >= 90:
            classification = "CRITICAL"
        elif final_score >= 70:
            classification = "HIGH"
        elif final_score >= 50:
            classification = "MEDIUM"
        else:
            classification = "LOW"

        return {
            "priority_score": final_score,
            "priority": classification,
            "reasons": reasons,
            "explanation": self._build_explanation(final_score, classification, reasons),
        }

    def _build_explanation(self, score: int, classification: str, reasons: List) -> str:
        top_reasons = [r["factor"] for r in reasons[:3]]
        r_str = "; ".join(top_reasons) if top_reasons else "standard processing"
        return (
            f"This order is classified {classification} with a priority score of {score}/100. "
            f"Key factors: {r_str}."
        )

    def batch_prioritize(self, orders: List[Dict]) -> List[Dict]:
        """Recalculate priority for all orders and return sorted list."""
        results = []
        for order in orders:
            result = self.calculate(order)
            order_copy = dict(order)
            order_copy["priority_score"] = result["priority_score"]
            order_copy["priority"] = result["priority"]
            order_copy["priority_reasons"] = result["reasons"]
            results.append(order_copy)
        return sorted(results, key=lambda x: x["priority_score"], reverse=True)
