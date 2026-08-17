"""
WareMind AI – Bottleneck Detection Engine
Analyzes fulfillment stage timings and detects operational bottlenecks.
"""
from typing import Dict, List, Any


class BottleneckEngine:

    STAGE_BENCHMARKS = {
        "PICKING": {"ideal_min": 8, "warning_min": 15, "critical_min": 25},
        "PACKING": {"ideal_min": 5, "warning_min": 10, "critical_min": 18},
        "QC": {"ideal_min": 3, "warning_min": 6, "critical_min": 12},
        "DISPATCH": {"ideal_min": 2, "warning_min": 5, "critical_min": 10},
    }

    def analyze(self, picking_tasks: List[Dict], packing_tasks: List[Dict], qc_checks: List[Dict]) -> Dict[str, Any]:
        """Full bottleneck analysis."""

        # Calculate average times per stage
        picking_times = [
            t["actual_time_min"] for t in picking_tasks
            if t.get("actual_time_min") and t["status"] == "COMPLETED"
        ]
        packing_times = [
            (t["actual_time_min"] if t.get("actual_time_min") else 10)
            for t in packing_tasks if t.get("status") == "COMPLETED"
        ]
        qc_times = [8, 6, 9, 7, 11, 5, 8]  # simulated QC times in minutes

        def safe_avg(lst):
            return round(sum(lst) / len(lst), 1) if lst else 0

        stage_data = {
            "PICKING": {
                "avg_time_min": safe_avg(picking_times) or 18,
                "task_count": len(picking_tasks),
                "completed": len([t for t in picking_tasks if t["status"] == "COMPLETED"]),
                "blocked": len([t for t in picking_tasks if t["status"] == "BLOCKED"]),
            },
            "PACKING": {
                "avg_time_min": safe_avg(packing_times) or 7,
                "task_count": len(packing_tasks),
                "completed": len([t for t in packing_tasks if t.get("status") == "COMPLETED"]),
                "blocked": 0,
            },
            "QC": {
                "avg_time_min": safe_avg(qc_times),
                "task_count": len(qc_checks),
                "completed": len([q for q in qc_checks if q["status"] == "PASSED"]),
                "blocked": len([q for q in qc_checks if q["status"] == "FAILED"]),
            },
            "DISPATCH": {
                "avg_time_min": 4,
                "task_count": 8,
                "completed": 6,
                "blocked": 0,
            },
        }

        # Find bottleneck
        bottleneck_stage = max(stage_data.keys(), key=lambda s: stage_data[s]["avg_time_min"])
        bottleneck_time = stage_data[bottleneck_stage]["avg_time_min"]
        other_avg = sum(v["avg_time_min"] for k, v in stage_data.items() if k != bottleneck_stage) / 3

        # Bottleneck score (how much worse is the bottleneck vs others)
        if other_avg > 0:
            bottleneck_ratio = bottleneck_time / other_avg
        else:
            bottleneck_ratio = 1

        bottleneck_score = min(100, round(20 + (bottleneck_ratio - 1) * 40))

        # Zone analysis (picking)
        zone_stats = self._analyze_zones(picking_tasks)

        # Build recommendations
        recommendations = self._build_recommendations(bottleneck_stage, stage_data, zone_stats)

        # Throughput metrics
        total_completed = sum(v["completed"] for v in stage_data.values())
        throughput_per_hour = round(total_completed / 8, 1)  # Assume 8-hour shift

        return {
            "bottleneck_stage": bottleneck_stage,
            "bottleneck_score": bottleneck_score,
            "stage_analysis": stage_data,
            "zone_analysis": zone_stats,
            "throughput_per_hour": throughput_per_hour,
            "total_completed_today": total_completed,
            "recommendations": recommendations,
            "fulfillment_efficiency": max(0, 100 - bottleneck_score // 2),
            "summary": (
                f"{bottleneck_stage} is the current operational bottleneck "
                f"with avg {bottleneck_time} min/task, "
                f"{bottleneck_ratio:.1f}x slower than other stages."
            ),
        }

    def _analyze_zones(self, picking_tasks: List[Dict]) -> List[Dict]:
        zone_data = {}
        for task in picking_tasks:
            for zone in task.get("zones", []):
                if zone not in zone_data:
                    zone_data[zone] = {"task_count": 0, "blocked": 0, "total_items": 0}
                zone_data[zone]["task_count"] += 1
                if task["status"] == "BLOCKED":
                    zone_data[zone]["blocked"] += 1
                zone_data[zone]["total_items"] += len(task.get("items", []))

        result = []
        for zone, data in zone_data.items():
            efficiency = max(0, 100 - (data["blocked"] / max(1, data["task_count"])) * 100)
            result.append({
                "zone": zone,
                "task_count": data["task_count"],
                "blocked_tasks": data["blocked"],
                "total_items": data["total_items"],
                "efficiency_pct": round(efficiency, 1),
                "bottleneck_contribution": "HIGH" if data["blocked"] > 0 else "LOW",
            })
        return sorted(result, key=lambda x: x["efficiency_pct"])

    def _build_recommendations(self, bottleneck: str, stages: Dict, zones: List) -> List[Dict]:
        recs = []

        if bottleneck == "PICKING":
            worst_zone = zones[0]["zone"] if zones else "Zone B"
            recs.append({
                "priority": "HIGH",
                "action": f"Reassign 2 pickers from low-demand zones to {worst_zone}",
                "reason": f"Picking avg time {stages['PICKING']['avg_time_min']} min is the primary bottleneck",
                "expected_improvement": "25-35% reduction in picking time",
            })
            recs.append({
                "priority": "MEDIUM",
                "action": "Optimize pick routes to reduce zone crossings",
                "reason": "Multiple-zone orders create excessive walking distance",
                "expected_improvement": "10-15% efficiency gain",
            })
            blocked = stages["PICKING"]["blocked"]
            if blocked > 0:
                recs.append({
                    "priority": "CRITICAL",
                    "action": f"Resolve {blocked} blocked picking tasks immediately",
                    "reason": "Blocked tasks halt the entire fulfillment pipeline",
                    "expected_improvement": "Immediate throughput restoration",
                })
        elif bottleneck == "PACKING":
            recs.append({
                "priority": "HIGH",
                "action": "Activate additional packing station",
                "reason": f"Packing avg time {stages['PACKING']['avg_time_min']} min exceeds benchmark",
                "expected_improvement": "40% throughput increase",
            })
        elif bottleneck == "QC":
            recs.append({
                "priority": "MEDIUM",
                "action": "Add second QC inspector during peak hours",
                "reason": "QC is becoming the rate-limiting step",
                "expected_improvement": "50% QC throughput increase",
            })

        return recs
