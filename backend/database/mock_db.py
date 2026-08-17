"""
WareMind AI - In-Memory Mock Database
Provides a complete in-memory data store that mirrors MongoDB operations.
Falls back to this when MongoDB is unavailable.
"""
import random
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import copy

# ─────────────────────────────────────────────
# Warehouse Zones
# ─────────────────────────────────────────────
ZONES = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"]

# ─────────────────────────────────────────────
# Products (50 SKUs)
# ─────────────────────────────────────────────
PRODUCTS_RAW = [
    {"sku": "SKU-101", "name": "Industrial Drill Bit Set", "category": "Tools", "unit_price": 45.99, "weight": 1.2},
    {"sku": "SKU-102", "name": "Safety Helmet Class E", "category": "Safety", "unit_price": 28.50, "weight": 0.6},
    {"sku": "SKU-103", "name": "Hydraulic Jack 3T", "category": "Heavy Equipment", "unit_price": 189.00, "weight": 15.0},
    {"sku": "SKU-104", "name": "LED Work Light 50W", "category": "Lighting", "unit_price": 67.00, "weight": 2.1},
    {"sku": "SKU-105", "name": "Steel Toe Boots Size 10", "category": "Safety", "unit_price": 89.99, "weight": 1.8},
    {"sku": "SKU-106", "name": "Cordless Impact Wrench", "category": "Tools", "unit_price": 145.00, "weight": 2.5},
    {"sku": "SKU-107", "name": "Heavy-Duty Tarpaulin 20x30", "category": "Storage", "unit_price": 55.00, "weight": 4.2},
    {"sku": "SKU-108", "name": "Industrial Gloves Pack/12", "category": "Safety", "unit_price": 18.99, "weight": 0.4},
    {"sku": "SKU-109", "name": "Angle Grinder 4.5in", "category": "Tools", "unit_price": 79.50, "weight": 2.8},
    {"sku": "SKU-110", "name": "Storage Bin Large Blue", "category": "Storage", "unit_price": 12.00, "weight": 0.8},
    {"sku": "SKU-111", "name": "Forklift Battery 48V", "category": "Heavy Equipment", "unit_price": 890.00, "weight": 45.0},
    {"sku": "SKU-112", "name": "Stretch Wrap Film 18in", "category": "Packaging", "unit_price": 24.99, "weight": 3.5},
    {"sku": "SKU-113", "name": "Hand Pallet Jack 2200lb", "category": "Heavy Equipment", "unit_price": 320.00, "weight": 62.0},
    {"sku": "SKU-114", "name": "Safety Vest High-Viz XL", "category": "Safety", "unit_price": 15.50, "weight": 0.3},
    {"sku": "SKU-115", "name": "Digital Torque Wrench", "category": "Tools", "unit_price": 225.00, "weight": 1.5},
    {"sku": "SKU-116", "name": "Anti-Fatigue Mat 3x5ft", "category": "Safety", "unit_price": 42.00, "weight": 2.0},
    {"sku": "SKU-117", "name": "Bubble Wrap Roll 50ft", "category": "Packaging", "unit_price": 19.99, "weight": 1.8},
    {"sku": "SKU-118", "name": "Barcode Scanner Wireless", "category": "Electronics", "unit_price": 185.00, "weight": 0.4},
    {"sku": "SKU-119", "name": "Conveyor Belt 10ft", "category": "Heavy Equipment", "unit_price": 540.00, "weight": 28.0},
    {"sku": "SKU-120", "name": "Label Printer ZPL", "category": "Electronics", "unit_price": 310.00, "weight": 3.2},
    {"sku": "SKU-121", "name": "Tape Gun Dispenser", "category": "Packaging", "unit_price": 8.99, "weight": 0.2},
    {"sku": "SKU-122", "name": "Shelf Rack Unit 5-tier", "category": "Storage", "unit_price": 135.00, "weight": 22.0},
    {"sku": "SKU-123", "name": "Ear Protection Pack/6", "category": "Safety", "unit_price": 14.50, "weight": 0.3},
    {"sku": "SKU-124", "name": "Floor Marking Tape Red", "category": "Safety", "unit_price": 9.99, "weight": 0.5},
    {"sku": "SKU-125", "name": "Pneumatic Nail Gun", "category": "Tools", "unit_price": 175.00, "weight": 3.1},
    {"sku": "SKU-126", "name": "Corrugated Box 12x12x12", "category": "Packaging", "unit_price": 2.50, "weight": 0.3},
    {"sku": "SKU-127", "name": "Safety Goggles Anti-Fog", "category": "Safety", "unit_price": 11.99, "weight": 0.2},
    {"sku": "SKU-128", "name": "Electric Chain Hoist 1T", "category": "Heavy Equipment", "unit_price": 695.00, "weight": 18.0},
    {"sku": "SKU-129", "name": "Ratchet Strap 4-Pack", "category": "Storage", "unit_price": 29.99, "weight": 1.0},
    {"sku": "SKU-130", "name": "Industrial Fan 24in", "category": "Electronics", "unit_price": 165.00, "weight": 8.5},
    {"sku": "SKU-131", "name": "Pipe Wrench 18in", "category": "Tools", "unit_price": 38.00, "weight": 1.9},
    {"sku": "SKU-132", "name": "Fire Extinguisher 5lb", "category": "Safety", "unit_price": 55.00, "weight": 3.8},
    {"sku": "SKU-133", "name": "Voltage Tester Non-Contact", "category": "Electronics", "unit_price": 32.00, "weight": 0.2},
    {"sku": "SKU-134", "name": "Drum Pump Electric", "category": "Heavy Equipment", "unit_price": 420.00, "weight": 6.5},
    {"sku": "SKU-135", "name": "Work Bench Steel 6ft", "category": "Furniture", "unit_price": 580.00, "weight": 85.0},
    {"sku": "SKU-136", "name": "Magnetic Parts Tray Set", "category": "Tools", "unit_price": 16.99, "weight": 0.5},
    {"sku": "SKU-137", "name": "Dock Bumper Rubber Set", "category": "Safety", "unit_price": 78.00, "weight": 5.5},
    {"sku": "SKU-138", "name": "RFID Asset Tag Pack/100", "category": "Electronics", "unit_price": 89.00, "weight": 0.3},
    {"sku": "SKU-139", "name": "Utility Cart 3-Shelf", "category": "Storage", "unit_price": 95.00, "weight": 12.0},
    {"sku": "SKU-140", "name": "Heat Gun Variable Speed", "category": "Tools", "unit_price": 62.00, "weight": 1.1},
    {"sku": "SKU-141", "name": "Plastic Drum 55-Gallon", "category": "Storage", "unit_price": 45.00, "weight": 7.0},
    {"sku": "SKU-142", "name": "Knee Pads Professional", "category": "Safety", "unit_price": 22.00, "weight": 0.4},
    {"sku": "SKU-143", "name": "Tool Cabinet 5-Drawer", "category": "Furniture", "unit_price": 340.00, "weight": 42.0},
    {"sku": "SKU-144", "name": "Stainless Steel Shelving", "category": "Furniture", "unit_price": 280.00, "weight": 35.0},
    {"sku": "SKU-145", "name": "Moisture Barrier Film", "category": "Packaging", "unit_price": 36.00, "weight": 2.8},
    {"sku": "SKU-146", "name": "Pallet Jack Scale Digital", "category": "Electronics", "unit_price": 750.00, "weight": 70.0},
    {"sku": "SKU-147", "name": "Cable Ties 100-Pack", "category": "Tools", "unit_price": 7.99, "weight": 0.3},
    {"sku": "SKU-148", "name": "Welding Helmet Auto-Dark", "category": "Safety", "unit_price": 115.00, "weight": 0.9},
    {"sku": "SKU-149", "name": "Pressure Washer 2000PSI", "category": "Heavy Equipment", "unit_price": 375.00, "weight": 14.0},
    {"sku": "SKU-150", "name": "Ergonomic Lift Assist Arm", "category": "Heavy Equipment", "unit_price": 1250.00, "weight": 38.0},
]

# ─────────────────────────────────────────────
# Customers (30)
# ─────────────────────────────────────────────
CUSTOMERS_RAW = [
    {"id": "C001", "name": "Apex Manufacturing Co.", "tier": "PREMIUM", "email": "orders@apexmfg.com"},
    {"id": "C002", "name": "Global Tools Ltd.", "tier": "STANDARD", "email": "purchase@globaltools.com"},
    {"id": "C003", "name": "SafetyFirst Industries", "tier": "PREMIUM", "email": "ops@safetyfirst.com"},
    {"id": "C004", "name": "Metro Builders Group", "tier": "STANDARD", "email": "supply@metrobuilders.com"},
    {"id": "C005", "name": "TechWarehouse Corp.", "tier": "ENTERPRISE", "email": "wh@techwarehouse.com"},
    {"id": "C006", "name": "Pacific Logistics LLC", "tier": "STANDARD", "email": "buy@paclogistics.com"},
    {"id": "C007", "name": "Ironclad Solutions", "tier": "ENTERPRISE", "email": "proc@ironclad.com"},
    {"id": "C008", "name": "NorthStar Equipment", "tier": "STANDARD", "email": "orders@northstar.com"},
    {"id": "C009", "name": "Summit Industrial", "tier": "PREMIUM", "email": "supply@summit.com"},
    {"id": "C010", "name": "Delta Freight Services", "tier": "STANDARD", "email": "ops@deltafreight.com"},
    {"id": "C011", "name": "Omega Tools & Supply", "tier": "ENTERPRISE", "email": "orders@omegatools.com"},
    {"id": "C012", "name": "Redwood Manufacturing", "tier": "PREMIUM", "email": "mgmt@redwoodmfg.com"},
    {"id": "C013", "name": "CityPro Construction", "tier": "STANDARD", "email": "buy@citypro.com"},
    {"id": "C014", "name": "Cascade Industries", "tier": "STANDARD", "email": "orders@cascade.com"},
    {"id": "C015", "name": "Frontier Warehousing", "tier": "ENTERPRISE", "email": "ops@frontier.com"},
    {"id": "C016", "name": "BlueLine Safety Co.", "tier": "PREMIUM", "email": "orders@bluelinesafety.com"},
    {"id": "C017", "name": "TerraFirma Builders", "tier": "STANDARD", "email": "supply@terrafirma.com"},
    {"id": "C018", "name": "Vertex Automation", "tier": "ENTERPRISE", "email": "proc@vertex.com"},
    {"id": "C019", "name": "Sunrise Distribution", "tier": "STANDARD", "email": "orders@sunrise.com"},
    {"id": "C020", "name": "PowerCore Industries", "tier": "PREMIUM", "email": "buy@powercore.com"},
    {"id": "C021", "name": "IronBridge Contractors", "tier": "STANDARD", "email": "ops@ironbridge.com"},
    {"id": "C022", "name": "Quantum Packaging Co.", "tier": "STANDARD", "email": "orders@quantumpkg.com"},
    {"id": "C023", "name": "Harbor View Logistics", "tier": "ENTERPRISE", "email": "mgmt@harborview.com"},
    {"id": "C024", "name": "Pinnacle Tools Group", "tier": "PREMIUM", "email": "ops@pinnacletools.com"},
    {"id": "C025", "name": "StormShield Safety", "tier": "STANDARD", "email": "orders@stormshield.com"},
    {"id": "C026", "name": "RocketShip Fulfillment", "tier": "ENTERPRISE", "email": "ops@rocketship.com"},
    {"id": "C027", "name": "Evergreen Supply Co.", "tier": "STANDARD", "email": "buy@evergreensupply.com"},
    {"id": "C028", "name": "GoldMine Equipment", "tier": "PREMIUM", "email": "orders@goldmine.com"},
    {"id": "C029", "name": "SteelFrame Builders", "tier": "STANDARD", "email": "proc@steelframe.com"},
    {"id": "C030", "name": "Zephyr Industrial Ltd.", "tier": "ENTERPRISE", "email": "ops@zephyr.com"},
]

# ─────────────────────────────────────────────
# Pickers/Packers
# ─────────────────────────────────────────────
PICKERS = [
    {"id": "P001", "name": "James Wilson", "zone": "Zone A", "shift": "Morning"},
    {"id": "P002", "name": "Maria Garcia", "zone": "Zone B", "shift": "Morning"},
    {"id": "P003", "name": "David Chen", "zone": "Zone C", "shift": "Morning"},
    {"id": "P004", "name": "Sarah Johnson", "zone": "Zone D", "shift": "Morning"},
    {"id": "P005", "name": "Michael Brown", "zone": "Zone E", "shift": "Afternoon"},
    {"id": "P006", "name": "Emma Davis", "zone": "Zone A", "shift": "Afternoon"},
    {"id": "P007", "name": "Robert Taylor", "zone": "Zone B", "shift": "Afternoon"},
]

PACKERS = [
    {"id": "PK001", "name": "Linda Martinez", "station": "Station 1"},
    {"id": "PK002", "name": "Thomas Anderson", "station": "Station 2"},
    {"id": "PK003", "name": "Alice Cooper", "station": "Station 3"},
]

# ─────────────────────────────────────────────
# Carriers
# ─────────────────────────────────────────────
CARRIERS = ["FedEx Express", "UPS Priority", "DHL Freight", "USPS Priority", "Amazon Logistics"]

def generate_id(prefix: str) -> str:
    return f"{prefix}-{random.randint(1000, 9999)}"

def days_ago(n: int) -> datetime:
    return datetime.utcnow() - timedelta(days=n)

def hours_ago(n: int) -> datetime:
    return datetime.utcnow() - timedelta(hours=n)

def hours_from_now(n: int) -> datetime:
    return datetime.utcnow() + timedelta(hours=n)

def days_from_now(n: int) -> datetime:
    return datetime.utcnow() + timedelta(days=n)

def seed_data():
    """Generate all seed data and return as dict of collections."""
    random.seed(42)
    now = datetime.utcnow()

    # ── Products & Inventory ──────────────────
    products = []
    inventory = []
    for i, p in enumerate(PRODUCTS_RAW):
        zone = ZONES[i % len(ZONES)]
        bin_loc = f"{zone[5]}{random.randint(1,8)}-{random.randint(1,20):02d}"
        
        # Deliberately create edge cases
        if p["sku"] in ["SKU-104", "SKU-108", "SKU-112"]:  # LOW STOCK
            qty = random.randint(3, 8)
            reorder = 20
        elif p["sku"] in ["SKU-111", "SKU-119", "SKU-150"]:  # OUT OF STOCK
            qty = 0
            reorder = 10
        elif p["sku"] in ["SKU-103", "SKU-106", "SKU-115"]:  # CRITICAL
            qty = random.randint(1, 4)
            reorder = 15
        elif p["sku"] in ["SKU-110", "SKU-117", "SKU-126"]:  # OVERSTOCK
            qty = random.randint(200, 400)
            reorder = 30
        else:
            qty = random.randint(25, 150)
            reorder = random.randint(10, 30)

        reorder_qty = reorder * 5
        avg_daily = round(random.uniform(1.5, 12.0), 1)
        lead_time = random.randint(2, 7)

        prod = {
            "_id": p["sku"],
            **p,
            "zone": zone,
            "bin_location": bin_loc,
            "supplier": f"Supplier-{random.randint(1,10):02d}",
            "lead_time_days": lead_time,
            "avg_daily_demand": avg_daily,
        }
        products.append(prod)

        reserved = 0
        if qty > 0:
            reserved = random.randint(0, min(10, qty // 3))

        inv_status = "HEALTHY"
        if qty == 0:
            inv_status = "OUT_OF_STOCK"
        elif qty <= reorder // 2:
            inv_status = "CRITICAL"
        elif qty <= reorder:
            inv_status = "LOW_STOCK"
        elif qty > 200:
            inv_status = "OVERSTOCK"

        inventory.append({
            "_id": p["sku"],
            "sku": p["sku"],
            "product_name": p["name"],
            "category": p["category"],
            "zone": zone,
            "bin_location": bin_loc,
            "quantity_available": qty,
            "quantity_reserved": reserved,
            "quantity_on_hand": qty + reserved,
            "reorder_level": reorder,
            "reorder_quantity": reorder_qty,
            "status": inv_status,
            "unit_price": p["unit_price"],
            "last_updated": (now - timedelta(hours=random.randint(0, 48))).isoformat(),
            "avg_daily_demand": avg_daily,
            "lead_time_days": lead_time,
        })

    # ── Orders (50) ─────────────────────────────
    statuses = ["PENDING", "PICKING", "PACKING", "QC", "DISPATCHED", "DELIVERED"]
    shipping_methods = ["STANDARD", "EXPRESS", "OVERNIGHT", "FREIGHT"]
    
    orders = []
    order_items_all = []
    
    # Specific edge-case orders first
    edge_orders = [
        {
            "order_id": "ORD-1001",
            "customer_id": "C001",
            "status": "PENDING",
            "priority": "CRITICAL",
            "shipping_method": "OVERNIGHT",
            "sla_hours": 4,
            "items": [("SKU-106", 8), ("SKU-115", 3)],  # CRITICAL low stock
            "days_back": 0.5,
            "notes": "Production line shutdown - URGENT",
        },
        {
            "order_id": "ORD-1002",
            "customer_id": "C007",
            "status": "PICKING",
            "priority": "HIGH",
            "shipping_method": "EXPRESS",
            "sla_hours": 8,
            "items": [("SKU-104", 12), ("SKU-108", 24)],  # Exceeds LOW stock
            "days_back": 1,
            "notes": "Safety compliance deadline",
        },
        {
            "order_id": "ORD-1003",
            "customer_id": "C005",
            "status": "PENDING",
            "priority": "HIGH",
            "shipping_method": "EXPRESS",
            "sla_hours": 12,
            "items": [("SKU-111", 2), ("SKU-119", 1)],  # OUT OF STOCK items
            "days_back": 0.2,
            "notes": "Warehouse expansion project",
        },
        {
            "order_id": "ORD-1004",
            "customer_id": "C015",
            "status": "QC",
            "priority": "MEDIUM",
            "shipping_method": "STANDARD",
            "sla_hours": 48,
            "items": [("SKU-102", 20), ("SKU-114", 30)],
            "days_back": 2,
            "notes": "Monthly safety restocking",
        },
        {
            "order_id": "ORD-1005",
            "customer_id": "C011",
            "status": "PACKING",
            "priority": "HIGH",
            "shipping_method": "EXPRESS",
            "sla_hours": 6,
            "items": [("SKU-118", 5), ("SKU-120", 2)],
            "days_back": 0.8,
            "notes": "Warehouse digitization project",
        },
        {
            "order_id": "ORD-1006",
            "customer_id": "C018",
            "status": "DISPATCHED",
            "priority": "CRITICAL",
            "shipping_method": "OVERNIGHT",
            "sla_hours": 4,
            "items": [("SKU-146", 3), ("SKU-113", 2)],
            "days_back": 3,
            "notes": "Factory floor setup",
        },
        {
            "order_id": "ORD-1007",
            "customer_id": "C023",
            "status": "PENDING",
            "priority": "MEDIUM",
            "shipping_method": "FREIGHT",
            "sla_hours": 72,
            "items": [("SKU-103", 4)],  # CRITICAL stock
            "days_back": 1.5,
            "notes": "Equipment upgrade",
        },
        {
            "order_id": "ORD-1008",
            "customer_id": "C026",
            "status": "DELIVERED",
            "priority": "HIGH",
            "shipping_method": "EXPRESS",
            "sla_hours": 12,
            "items": [("SKU-101", 15), ("SKU-109", 10)],
            "days_back": 5,
            "notes": "Tool restocking",
        },
        {
            "order_id": "ORD-1009",
            "customer_id": "C001",
            "status": "PICKING",
            "priority": "CRITICAL",
            "shipping_method": "OVERNIGHT",
            "sla_hours": 3,
            "items": [("SKU-128", 2), ("SKU-103", 3)],  # Competing with ORD-1007 for SKU-103
            "days_back": 0.1,
            "notes": "Emergency hoist replacement",
        },
        {
            "order_id": "ORD-1010",
            "customer_id": "C012",
            "status": "PENDING",
            "priority": "LOW",
            "shipping_method": "STANDARD",
            "sla_hours": 120,
            "items": [("SKU-122", 5), ("SKU-139", 8)],
            "days_back": 4,
            "notes": "Storage expansion",
        },
    ]

    for eo in edge_orders:
        cust = next(c for c in CUSTOMERS_RAW if c["id"] == eo["customer_id"])
        created_at = now - timedelta(days=eo["days_back"])
        items = []
        total_qty = 0
        total_val = 0
        for sku, qty in eo["items"]:
            prod = next(p for p in PRODUCTS_RAW if p["sku"] == sku)
            items.append({
                "sku": sku,
                "product_name": prod["name"],
                "quantity_ordered": qty,
                "unit_price": prod["unit_price"],
                "status": "PENDING",
            })
            total_qty += qty
            total_val += qty * prod["unit_price"]
            order_items_all.append({
                "_id": str(uuid.uuid4()),
                "order_id": eo["order_id"],
                "sku": sku,
                "product_name": prod["name"],
                "quantity_ordered": qty,
                "quantity_allocated": 0,
                "unit_price": prod["unit_price"],
                "status": "PENDING",
            })

        sla_deadline = created_at + timedelta(hours=eo["sla_hours"])
        dispatch_eta = now + timedelta(hours=random.randint(2, 48))
        
        picker = random.choice(PICKERS)
        order = {
            "_id": eo["order_id"],
            "order_id": eo["order_id"],
            "customer_id": eo["customer_id"],
            "customer_name": cust["name"],
            "customer_tier": cust["tier"],
            "order_date": created_at.isoformat(),
            "items": items,
            "total_quantity": total_qty,
            "total_value": round(total_val, 2),
            "status": eo["status"],
            "priority": eo["priority"],
            "priority_score": {"CRITICAL": 92, "HIGH": 78, "MEDIUM": 55, "LOW": 32}[eo["priority"]],
            "shipping_method": eo["shipping_method"],
            "sla_deadline": sla_deadline.isoformat(),
            "expected_dispatch": dispatch_eta.isoformat(),
            "assigned_picker": picker["name"],
            "picker_id": picker["id"],
            "inventory_status": "PARTIAL" if any(s in ["SKU-104","SKU-108","SKU-103","SKU-106","SKU-111","SKU-115","SKU-119","SKU-150"] for s,q in eo["items"]) else "AVAILABLE",
            "allocation_status": "PARTIALLY_ALLOCATED" if any(s in ["SKU-104","SKU-108","SKU-103","SKU-106","SKU-111","SKU-115","SKU-119","SKU-150"] for s,q in eo["items"]) else "FULLY_ALLOCATED",
            "risk_level": "HIGH" if eo["priority"] in ["CRITICAL", "HIGH"] and eo["sla_hours"] <= 12 else "MEDIUM" if eo["sla_hours"] <= 48 else "LOW",
            "notes": eo["notes"],
            "created_at": created_at.isoformat(),
            "updated_at": now.isoformat(),
            "timeline": build_timeline(eo["status"], created_at, now),
            "priority_reasons": build_priority_reasons(eo),
        }
        orders.append(order)

    # Generate remaining 40 orders
    used_ids = {o["order_id"] for o in orders}
    for i in range(11, 51):
        oid = f"ORD-1{i:03d}"
        if oid in used_ids:
            continue
        cust = random.choice(CUSTOMERS_RAW)
        status = random.choice(statuses)
        shipping = random.choice(shipping_methods)
        priority = random.choice(["CRITICAL", "HIGH", "HIGH", "MEDIUM", "MEDIUM", "MEDIUM", "LOW"])
        sla_h = {"OVERNIGHT": 4, "EXPRESS": 12, "STANDARD": 72, "FREIGHT": 120}[shipping]
        days_back = random.uniform(0.1, 6)
        created_at = now - timedelta(days=days_back)
        sla_deadline = created_at + timedelta(hours=sla_h)
        
        # Pick 1-4 random products
        n_items = random.randint(1, 4)
        item_skus = random.sample([p["sku"] for p in PRODUCTS_RAW], n_items)
        items = []
        total_qty = 0
        total_val = 0
        for sku in item_skus:
            prod = next(p for p in PRODUCTS_RAW if p["sku"] == sku)
            qty = random.randint(1, 20)
            items.append({
                "sku": sku,
                "product_name": prod["name"],
                "quantity_ordered": qty,
                "unit_price": prod["unit_price"],
                "status": "PENDING",
            })
            total_qty += qty
            total_val += qty * prod["unit_price"]
            order_items_all.append({
                "_id": str(uuid.uuid4()),
                "order_id": oid,
                "sku": sku,
                "product_name": prod["name"],
                "quantity_ordered": qty,
                "quantity_allocated": qty,
                "unit_price": prod["unit_price"],
                "status": "ALLOCATED",
            })

        picker = random.choice(PICKERS)
        ps = {"CRITICAL": random.randint(88,95), "HIGH": random.randint(70,87), "MEDIUM": random.randint(50,69), "LOW": random.randint(20,49)}[priority]
        risk = "HIGH" if priority == "CRITICAL" and (sla_deadline - now).total_seconds() < 14400 else "MEDIUM" if priority == "HIGH" else "LOW"

        order = {
            "_id": oid,
            "order_id": oid,
            "customer_id": cust["id"],
            "customer_name": cust["name"],
            "customer_tier": cust["tier"],
            "order_date": created_at.isoformat(),
            "items": items,
            "total_quantity": total_qty,
            "total_value": round(total_val, 2),
            "status": status,
            "priority": priority,
            "priority_score": ps,
            "shipping_method": shipping,
            "sla_deadline": sla_deadline.isoformat(),
            "expected_dispatch": (now + timedelta(hours=random.randint(2, 96))).isoformat(),
            "assigned_picker": picker["name"],
            "picker_id": picker["id"],
            "inventory_status": "AVAILABLE",
            "allocation_status": "FULLY_ALLOCATED",
            "risk_level": risk,
            "notes": "",
            "created_at": created_at.isoformat(),
            "updated_at": now.isoformat(),
            "timeline": build_timeline(status, created_at, now),
            "priority_reasons": [],
        }
        orders.append(order)

    # ── Picking Tasks ──────────────────────────
    picking_tasks = []
    picking_statuses = ["WAITING", "PICKING", "COMPLETED", "BLOCKED"]
    for i, order in enumerate(orders[:25]):
        status_map = {
            "PENDING": "WAITING",
            "PICKING": "PICKING",
            "PACKING": "COMPLETED",
            "QC": "COMPLETED",
            "DISPATCHED": "COMPLETED",
            "DELIVERED": "COMPLETED",
        }
        pt_status = status_map.get(order["status"], "WAITING")
        if i == 3:
            pt_status = "BLOCKED"  # One blocked for demo

        # Build zone route
        zones_in_order = list(set([
            next(p for p in PRODUCTS_RAW if p["sku"] == item["sku"])["sku"][:5]
            for item in order["items"]
        ]))
        item_zones = []
        for item in order["items"]:
            inv = next((inv for inv in inventory if inv["sku"] == item["sku"]), None)
            if inv:
                item_zones.append(inv["zone"])
        unique_zones = sorted(set(item_zones))
        optimized_route = " → ".join(unique_zones) if unique_zones else "Zone A"

        est_time = len(order["items"]) * 4 + len(unique_zones) * 3
        actual_time = est_time + random.randint(-2, 8) if pt_status == "COMPLETED" else None

        picking_tasks.append({
            "_id": f"PT-{1000+i}",
            "task_id": f"PT-{1000+i}",
            "order_id": order["order_id"],
            "customer_name": order["customer_name"],
            "picker_id": order["picker_id"],
            "picker_name": order["assigned_picker"],
            "zones": unique_zones,
            "optimized_route": optimized_route,
            "items": order["items"],
            "priority": order["priority"],
            "status": pt_status,
            "estimated_time_min": est_time,
            "actual_time_min": actual_time,
            "blocked_reason": "Missing SKU-111 - Out of Stock" if pt_status == "BLOCKED" else None,
            "created_at": order["created_at"],
            "started_at": (now - timedelta(minutes=random.randint(10, 60))).isoformat() if pt_status in ["PICKING", "COMPLETED", "BLOCKED"] else None,
            "completed_at": (now - timedelta(minutes=random.randint(5, 30))).isoformat() if pt_status == "COMPLETED" else None,
        })

    # ── Packing Tasks ──────────────────────────
    packing_tasks = []
    packing_statuses_map = {
        "PACKING": "IN_PROGRESS",
        "QC": "COMPLETED",
        "DISPATCHED": "COMPLETED",
        "DELIVERED": "COMPLETED",
    }
    for i, order in enumerate(orders[:20]):
        if order["status"] not in ["PACKING", "QC", "DISPATCHED", "DELIVERED"]:
            continue
        packer = PACKERS[i % len(PACKERS)]
        pkg_types = ["Box-S", "Box-M", "Box-L", "Crate", "Pallet"]
        packing_tasks.append({
            "_id": f"PK-{2000+i}",
            "task_id": f"PK-{2000+i}",
            "order_id": order["order_id"],
            "customer_name": order["customer_name"],
            "packer_id": packer["id"],
            "packer_name": packer["name"],
            "station": packer["station"],
            "items": order["items"],
            "package_type": random.choice(pkg_types),
            "weight_kg": round(sum(item["quantity_ordered"] * 0.5 for item in order["items"]), 2),
            "status": packing_statuses_map.get(order["status"], "PENDING"),
            "started_at": (now - timedelta(minutes=random.randint(15, 90))).isoformat(),
            "completed_at": (now - timedelta(minutes=random.randint(5, 30))).isoformat() if order["status"] in ["QC","DISPATCHED","DELIVERED"] else None,
            "notes": "",
        })

    # ── Quality Checks ─────────────────────────
    qc_checks = []
    qc_statuses = ["PASSED", "FAILED", "REQUIRES_REVIEW"]
    for i, order in enumerate(orders[:15]):
        if order["status"] not in ["QC", "DISPATCHED", "DELIVERED"]:
            continue
        qc_status = "PASSED"
        if i == 0:  # One QC failure for demo
            qc_status = "FAILED"
        elif i == 2:
            qc_status = "REQUIRES_REVIEW"

        qc_checks.append({
            "_id": f"QC-{3000+i}",
            "qc_id": f"QC-{3000+i}",
            "order_id": order["order_id"],
            "customer_name": order["customer_name"],
            "inspector": "Quality Inspector 1",
            "checklist": {
                "correct_sku": qc_status != "FAILED",
                "correct_quantity": qc_status != "FAILED",
                "product_condition": qc_status not in ["FAILED", "REQUIRES_REVIEW"],
                "packaging_condition": True,
                "label_correct": True,
                "address_correct": True,
            },
            "status": qc_status,
            "failure_reason": "3 units of SKU-102 found damaged during inspection" if qc_status == "FAILED" else ("Quantity mismatch - 1 unit short" if qc_status == "REQUIRES_REVIEW" else None),
            "checked_at": (now - timedelta(minutes=random.randint(10, 120))).isoformat(),
            "items": order["items"],
        })

    # ── Exceptions ─────────────────────────────
    exception_types = [
        "MISSING_ITEM", "DAMAGED_ITEM", "STOCK_SHORTAGE", "WRONG_SKU",
        "WRONG_QUANTITY", "PICKING_DELAY", "PACKING_DELAY", "QC_FAILURE", "DISPATCH_DELAY"
    ]
    severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    exception_statuses = ["OPEN", "IN_PROGRESS", "RESOLVED"]
    
    exceptions_data = []
    ex_templates = [
        {
            "type": "STOCK_SHORTAGE",
            "severity": "CRITICAL",
            "order_id": "ORD-1001",
            "sku": "SKU-106",
            "description": "Insufficient stock for CRITICAL order. Required: 8, Available: 3",
            "system_decision": "Allocate available 3 units to ORD-1001 (CRITICAL). Place backorder for remaining 5 units.",
            "recommended_action": "Initiate emergency replenishment for SKU-106. Contact Supplier-04.",
            "business_impact": "Production line shutdown risk. Potential $45,000 loss per hour for customer Apex Manufacturing.",
            "resolution_options": ["EMERGENCY_REPLENISHMENT", "PARTIAL_FULFILLMENT", "TRANSFER_FROM_BRANCH"],
            "status": "IN_PROGRESS",
            "detected_at": hours_ago(2).isoformat(),
        },
        {
            "type": "DAMAGED_ITEM",
            "severity": "HIGH",
            "order_id": "ORD-1004",
            "sku": "SKU-102",
            "description": "3 units of Safety Helmet Class E found damaged during QC inspection",
            "system_decision": "Remove 3 damaged units from available inventory. Reallocate from bin A3-15.",
            "recommended_action": "Replace damaged units from Zone B overstock. Update inventory -3 for SKU-102.",
            "business_impact": "QC failure delays dispatch by estimated 4 hours. SLA at risk.",
            "resolution_options": ["REPLACE_ITEM", "PARTIAL_FULFILLMENT", "HOLD_ORDER"],
            "status": "OPEN",
            "detected_at": hours_ago(1).isoformat(),
        },
        {
            "type": "STOCK_SHORTAGE",
            "severity": "CRITICAL",
            "order_id": "ORD-1003",
            "sku": "SKU-111",
            "description": "SKU-111 Forklift Battery 48V is completely OUT OF STOCK. Order cannot be fulfilled.",
            "system_decision": "Place full backorder. Cannot partially fulfill - product is non-substitutable.",
            "recommended_action": "Issue emergency PO to Supplier-07. Customer notification recommended.",
            "business_impact": "Complete order hold. Customer warehouse expansion project blocked.",
            "resolution_options": ["BACKORDER", "CANCEL_ITEM", "SUBSTITUTE_PRODUCT"],
            "status": "OPEN",
            "detected_at": hours_ago(3).isoformat(),
        },
        {
            "type": "PICKING_DELAY",
            "severity": "HIGH",
            "order_id": "ORD-1009",
            "sku": "SKU-128",
            "description": "Picking task PT-1008 blocked. Item not found at designated bin location A2-07.",
            "system_decision": "Trigger bin audit for Zone A. Reassign picker to search bins A2-06 and A2-08.",
            "recommended_action": "Initiate zone audit. Escalate to warehouse manager if not resolved in 30 min.",
            "business_impact": "CRITICAL order SLA breach in 3 hours. Customer production impact.",
            "resolution_options": ["BIN_AUDIT", "REALLOCATE_FROM_ALTERNATE_BIN", "ESCALATE"],
            "status": "IN_PROGRESS",
            "detected_at": hours_ago(0.5).isoformat(),
        },
        {
            "type": "QC_FAILURE",
            "severity": "MEDIUM",
            "order_id": "ORD-1004",
            "sku": "SKU-114",
            "description": "Safety Vest quantity mismatch. Ordered 30, packed 29. Missing 1 unit.",
            "system_decision": "Hold dispatch. Return to packing for correction.",
            "recommended_action": "Locate missing unit in packing station. Recount and repack.",
            "business_impact": "Minor delay. SLA has 36 hours remaining. Low risk.",
            "resolution_options": ["REPACK", "PARTIAL_DISPATCH", "ISSUE_CREDIT"],
            "status": "OPEN",
            "detected_at": hours_ago(0.3).isoformat(),
        },
        {
            "type": "DISPATCH_DELAY",
            "severity": "HIGH",
            "order_id": "ORD-1006",
            "sku": None,
            "description": "FedEx Express pickup missed. Next pickup slot in 4 hours.",
            "system_decision": "Reroute to UPS Priority for same-day pickup at 3:00 PM.",
            "recommended_action": "Contact UPS Priority for emergency pickup. Update tracking info.",
            "business_impact": "Delivery delay of 6 hours. Customer SLA breach risk.",
            "resolution_options": ["REROUTE_CARRIER", "EMERGENCY_COURIER", "NOTIFY_CUSTOMER"],
            "status": "IN_PROGRESS",
            "detected_at": hours_ago(1).isoformat(),
        },
        {
            "type": "WRONG_SKU",
            "severity": "MEDIUM",
            "order_id": "ORD-1005",
            "sku": "SKU-118",
            "description": "Wrong product picked. Barcode scanner error - SKU-118 picked instead of SKU-120.",
            "system_decision": "Return incorrect item to Zone C bin. Pick correct SKU-120 from bin C4-12.",
            "recommended_action": "Recalibrate barcode scanner at picking station. Repick SKU-120.",
            "business_impact": "30-minute delay. SLA has 5 hours remaining. Manageable.",
            "resolution_options": ["REPICK_CORRECT_ITEM", "SCANNER_RECALIBRATION"],
            "status": "RESOLVED",
            "detected_at": hours_ago(4).isoformat(),
        },
        {
            "type": "STOCK_SHORTAGE",
            "severity": "HIGH",
            "order_id": "ORD-1002",
            "sku": "SKU-104",
            "description": "LED Work Light 50W: Required 12, Available 5. Two orders competing for same SKU.",
            "system_decision": "Prioritize ORD-1002 (HIGH, Enterprise) over ORD-1018 (MEDIUM). Allocate 5 to ORD-1002, backorder ORD-1018.",
            "recommended_action": "Immediate reorder of 50 units. Expected replenishment in 3 days.",
            "business_impact": "ORD-1018 delayed 3 days. Customer notified. Revenue at risk: $804.",
            "resolution_options": ["PRIORITY_ALLOCATION", "SPLIT_ORDER", "EXPEDITE_REPLENISHMENT"],
            "status": "IN_PROGRESS",
            "detected_at": hours_ago(1.5).isoformat(),
        },
        {
            "type": "MISSING_ITEM",
            "severity": "MEDIUM",
            "order_id": "ORD-1010",
            "sku": "SKU-139",
            "description": "8 units of Utility Cart 3-Shelf not found in designated bin D5-03.",
            "system_decision": "Check overflow bin D5-04 and D6-01. Trigger inventory reconciliation.",
            "recommended_action": "Manual bin search. If not found, escalate to inventory manager for adjustment.",
            "business_impact": "LOW priority order. SLA has 4 days. No immediate risk.",
            "resolution_options": ["BIN_SEARCH", "INVENTORY_ADJUSTMENT", "REORDER"],
            "status": "OPEN",
            "detected_at": hours_ago(0.7).isoformat(),
        },
        {
            "type": "PACKING_DELAY",
            "severity": "LOW",
            "order_id": "ORD-1008",
            "sku": None,
            "description": "Packing Station 2 equipment malfunction. Scale not calibrated.",
            "system_decision": "Redirect order to Station 3. Estimated 15-minute delay.",
            "recommended_action": "Maintenance ticket raised. Use Station 3 as backup.",
            "business_impact": "Minor delay. Order already dispatched. No customer impact.",
            "resolution_options": ["STATION_REDIRECT", "MAINTENANCE_TICKET"],
            "status": "RESOLVED",
            "detected_at": hours_ago(6).isoformat(),
        },
    ]

    for j, ex in enumerate(ex_templates):
        exceptions_data.append({
            "_id": f"EX-{4000+j}",
            "exception_id": f"EX-{4000+j}",
            **ex,
            "resolution_notes": "Issue resolved successfully." if ex["status"] == "RESOLVED" else None,
            "resolved_at": hours_ago(3).isoformat() if ex["status"] == "RESOLVED" else None,
            "assigned_to": "Warehouse Manager",
        })

    # Add more random exceptions
    for j in range(10, 20):
        ex_type = random.choice(exception_types)
        order = random.choice(orders)
        sev = random.choice(severities)
        exceptions_data.append({
            "_id": f"EX-{4000+j}",
            "exception_id": f"EX-{4000+j}",
            "type": ex_type,
            "severity": sev,
            "order_id": order["order_id"],
            "sku": random.choice([p["sku"] for p in PRODUCTS_RAW]) if ex_type not in ["PACKING_DELAY","DISPATCH_DELAY"] else None,
            "description": f"{ex_type.replace('_',' ').title()} detected on {order['order_id']}",
            "system_decision": "Automated analysis in progress. Manual review recommended.",
            "recommended_action": "Review and resolve according to SOP.",
            "business_impact": f"Potential delay of {random.randint(1,8)} hours.",
            "resolution_options": ["MANUAL_REVIEW", "ESCALATE"],
            "status": random.choice(exception_statuses),
            "detected_at": hours_ago(random.uniform(0.5, 12)).isoformat(),
            "resolution_notes": None,
            "resolved_at": None,
            "assigned_to": "Warehouse Manager",
        })

    # ── Dispatches ─────────────────────────────
    dispatches = []
    dispatch_statuses = ["READY", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "DELAYED"]
    for i, order in enumerate(orders[:15]):
        if order["status"] not in ["DISPATCHED", "DELIVERED", "QC"]:
            continue
        ds = "DISPATCHED" if order["status"] == "DISPATCHED" else "DELIVERED" if order["status"] == "DELIVERED" else "READY"
        delay_risk = "HIGH" if order["risk_level"] == "HIGH" else "LOW"
        dispatches.append({
            "_id": f"DS-{5000+i}",
            "dispatch_id": f"DS-{5000+i}",
            "order_id": order["order_id"],
            "customer_name": order["customer_name"],
            "carrier": random.choice(CARRIERS),
            "tracking_number": f"TRK{random.randint(100000000, 999999999)}",
            "package_count": len(order["items"]),
            "weight_kg": round(sum(item["quantity_ordered"] * 0.5 for item in order["items"]), 2),
            "status": ds,
            "dispatched_at": (now - timedelta(hours=random.randint(1, 24))).isoformat() if ds in ["DISPATCHED","IN_TRANSIT","DELIVERED"] else None,
            "expected_delivery": days_from_now(random.randint(1, 5)).isoformat(),
            "actual_delivery": now.isoformat() if ds == "DELIVERED" else None,
            "delay_risk": delay_risk,
            "notes": "FedEx pickup rescheduled" if i == 0 else "",
        })

    # ── Notifications ──────────────────────────
    notifications = [
        {"_id": "N001", "type": "CRITICAL_STOCK", "severity": "CRITICAL", "title": "SKU-111 Out of Stock", "message": "Forklift Battery 48V is completely out of stock. 2 orders affected.", "read": False, "created_at": hours_ago(2).isoformat()},
        {"_id": "N002", "type": "SLA_RISK", "severity": "CRITICAL", "title": "SLA Breach Risk - ORD-1001", "message": "CRITICAL order ORD-1001 SLA deadline in 2 hours. Insufficient inventory.", "read": False, "created_at": hours_ago(0.5).isoformat()},
        {"_id": "N003", "type": "STOCK_SHORTAGE", "severity": "HIGH", "title": "Stock Conflict Detected", "message": "SKU-104 contested by 2 orders. Priority allocation required.", "read": False, "created_at": hours_ago(1).isoformat()},
        {"_id": "N004", "type": "QC_FAILURE", "severity": "HIGH", "title": "QC Failed - ORD-1004", "message": "3 units damaged during quality inspection. Replacement needed.", "read": False, "created_at": hours_ago(0.8).isoformat()},
        {"_id": "N005", "type": "PICKING_DELAY", "severity": "HIGH", "title": "Picking Blocked - ORD-1009", "message": "Picker cannot locate SKU-128 in designated bin. SLA at risk.", "read": True, "created_at": hours_ago(1.2).isoformat()},
        {"_id": "N006", "type": "REORDER_RECOMMENDATION", "severity": "WARNING", "title": "Reorder Recommended - SKU-104", "message": "LED Work Light 50W projected to stock out in 2 days. Reorder 100 units.", "read": True, "created_at": hours_ago(3).isoformat()},
        {"_id": "N007", "type": "DISPATCH_DELAY", "severity": "HIGH", "title": "Dispatch Delayed - ORD-1006", "message": "FedEx missed pickup. Rerouting to UPS Priority.", "read": True, "created_at": hours_ago(1).isoformat()},
        {"_id": "N008", "type": "CRITICAL_STOCK", "severity": "CRITICAL", "title": "SKU-119 Out of Stock", "message": "Conveyor Belt 10ft is out of stock. 1 order blocked.", "read": False, "created_at": hours_ago(4).isoformat()},
        {"_id": "N009", "type": "INFO", "severity": "INFO", "title": "Daily Fulfillment Report", "message": "12 orders dispatched today. Fulfillment rate 94%. Zone B bottleneck detected.", "read": True, "created_at": hours_ago(8).isoformat()},
        {"_id": "N010", "type": "INFO", "severity": "INFO", "title": "Shift Change", "message": "Afternoon shift has started. 8 active picking tasks transferred.", "read": True, "created_at": hours_ago(6).isoformat()},
    ]

    # ── Decision Logs ──────────────────────────
    decision_logs = [
        {
            "_id": "DL001",
            "decision_type": "PRIORITY_CALCULATION",
            "timestamp": hours_ago(2).isoformat(),
            "input_data": {"order_id": "ORD-1001", "shipping": "OVERNIGHT", "customer_tier": "PREMIUM"},
            "decision": "Classified as CRITICAL (Score: 92)",
            "reason": "Express shipping + PREMIUM customer + SLA deadline < 4h + Inventory shortage",
            "affected_entities": ["ORD-1001"],
            "recommended_action": "Immediate allocation and picking assignment",
        },
        {
            "_id": "DL002",
            "decision_type": "INVENTORY_ALLOCATION",
            "timestamp": hours_ago(1.5).isoformat(),
            "input_data": {"sku": "SKU-104", "available": 5, "orders": ["ORD-1002", "ORD-1018"]},
            "decision": "Allocated 5 units to ORD-1002. ORD-1018 placed on backorder.",
            "reason": "ORD-1002 priority score 78 > ORD-1018 priority score 55. ENTERPRISE customer vs STANDARD.",
            "affected_entities": ["ORD-1002", "ORD-1018", "SKU-104"],
            "recommended_action": "Expedite SKU-104 replenishment. ETA 3 days.",
        },
        {
            "_id": "DL003",
            "decision_type": "REPLENISHMENT_RECOMMENDATION",
            "timestamp": hours_ago(3).isoformat(),
            "input_data": {"sku": "SKU-104", "current_stock": 5, "avg_daily": 8.5, "lead_time": 3},
            "decision": "Immediate reorder of 85 units recommended.",
            "reason": "Projected stockout in 0.6 days. Lead time 3 days. Safety stock buffer applied.",
            "affected_entities": ["SKU-104"],
            "recommended_action": "Issue PO to Supplier-05 for 85 units.",
        },
        {
            "_id": "DL004",
            "decision_type": "EXCEPTION_RESOLUTION",
            "timestamp": hours_ago(4).isoformat(),
            "input_data": {"exception_id": "EX-4006", "type": "WRONG_SKU", "order_id": "ORD-1005"},
            "decision": "Return SKU-118 to Zone C. Repick SKU-120.",
            "reason": "Scanner error detected. Correct SKU located in bin C4-12.",
            "affected_entities": ["ORD-1005", "SKU-118", "SKU-120"],
            "recommended_action": "Scanner recalibration scheduled.",
        },
    ]

    # ── Inventory Movements ────────────────────
    movements = []
    movement_types = ["INBOUND", "OUTBOUND", "ADJUSTMENT", "TRANSFER", "DAMAGED"]
    for i in range(30):
        sku = random.choice([p["sku"] for p in PRODUCTS_RAW])
        m_type = random.choice(movement_types)
        qty = random.randint(1, 50) * (-1 if m_type in ["OUTBOUND","DAMAGED"] else 1)
        movements.append({
            "_id": f"MV-{6000+i}",
            "sku": sku,
            "movement_type": m_type,
            "quantity": qty,
            "order_id": random.choice(orders)["order_id"] if m_type == "OUTBOUND" else None,
            "reason": m_type.lower().replace("_"," ").title(),
            "timestamp": hours_ago(random.uniform(0.5, 72)).isoformat(),
        })

    # ── Users ──────────────────────────────────
    users = [
        {"_id": "U001", "username": "admin", "password": "admin123", "name": "Admin User", "role": "ADMIN", "email": "admin@waremind.ai", "warehouse": "WH-001"},
        {"_id": "U002", "username": "manager", "password": "manager123", "name": "Alex Thompson", "role": "WAREHOUSE_MANAGER", "email": "alex@waremind.ai", "warehouse": "WH-001"},
        {"_id": "U003", "username": "picker1", "password": "picker123", "name": "James Wilson", "role": "PICKER", "email": "james@waremind.ai", "warehouse": "WH-001"},
        {"_id": "U004", "username": "packer1", "password": "packer123", "name": "Linda Martinez", "role": "PACKER", "email": "linda@waremind.ai", "warehouse": "WH-001"},
        {"_id": "U005", "username": "qc1", "password": "qc123", "name": "Quality Inspector 1", "role": "QUALITY_INSPECTOR", "email": "qc@waremind.ai", "warehouse": "WH-001"},
    ]

    return {
        "products": products,
        "inventory": inventory,
        "orders": orders,
        "order_items": order_items_all,
        "picking_tasks": picking_tasks,
        "packing_tasks": packing_tasks,
        "quality_checks": qc_checks,
        "exceptions": exceptions_data,
        "dispatches": dispatches,
        "notifications": notifications,
        "decision_logs": decision_logs,
        "inventory_movements": movements,
        "users": users,
    }

def build_timeline(status: str, created_at: datetime, now: datetime) -> List[Dict]:
    stages = [
        ("ORDER_CREATED", "Order Created", "COMPLETED"),
        ("PRIORITY_ASSIGNED", "Priority Assigned", "COMPLETED"),
        ("INVENTORY_CHECKED", "Inventory Checked", "COMPLETED"),
        ("ALLOCATED", "Stock Allocated", "COMPLETED"),
        ("PICKING", "Picking", "COMPLETED"),
        ("PACKING", "Packing", "COMPLETED"),
        ("QC", "Quality Check", "COMPLETED"),
        ("DISPATCHED", "Dispatched", "COMPLETED"),
    ]
    status_order = ["PENDING", "PICKING", "PACKING", "QC", "DISPATCHED", "DELIVERED"]
    current_idx = status_order.index(status) if status in status_order else 0
    
    timeline = []
    t = created_at
    for i, (key, label, _) in enumerate(stages):
        stage_status = "COMPLETED"
        if i > current_idx + 2:
            stage_status = "PENDING"
        elif i == current_idx + 2:
            stage_status = "IN_PROGRESS"
        
        timeline.append({
            "stage": key,
            "label": label,
            "status": stage_status,
            "timestamp": (t + timedelta(minutes=i*25)).isoformat() if stage_status != "PENDING" else None,
        })
    return timeline

def build_priority_reasons(order: dict) -> List[Dict]:
    reasons = []
    if order.get("shipping_method") == "OVERNIGHT":
        reasons.append({"factor": "Overnight shipping", "weight": 25, "impact": "HIGH"})
    elif order.get("shipping_method") == "EXPRESS":
        reasons.append({"factor": "Express shipping", "weight": 15, "impact": "HIGH"})
    
    sla_h = order.get("sla_hours", 72)
    if sla_h <= 4:
        reasons.append({"factor": f"SLA deadline in {sla_h} hours", "weight": 30, "impact": "CRITICAL"})
    elif sla_h <= 12:
        reasons.append({"factor": f"SLA deadline in {sla_h} hours", "weight": 20, "impact": "HIGH"})
    
    cust = next((c for c in CUSTOMERS_RAW if c["id"] == order.get("customer_id")), None)
    if cust:
        if cust["tier"] == "ENTERPRISE":
            reasons.append({"factor": "Enterprise customer", "weight": 20, "impact": "HIGH"})
        elif cust["tier"] == "PREMIUM":
            reasons.append({"factor": "Premium customer", "weight": 15, "impact": "MEDIUM"})
    
    inv_status = order.get("inventory_status", "AVAILABLE")
    if inv_status == "PARTIAL":
        reasons.append({"factor": "Partial inventory available - shortage risk", "weight": -10, "impact": "NEGATIVE"})
    else:
        reasons.append({"factor": "Inventory fully available", "weight": 10, "impact": "POSITIVE"})
    
    if order.get("notes"):
        reasons.append({"factor": order["notes"], "weight": 5, "impact": "MEDIUM"})
    
    return reasons

# Singleton data store
_data_store: Optional[Dict[str, List]] = None

def get_store() -> Dict[str, List]:
    global _data_store
    if _data_store is None:
        _data_store = seed_data()
    return _data_store

def get_collection(name: str) -> List[Dict]:
    return get_store().get(name, [])

def find_one(collection: str, query: Dict) -> Optional[Dict]:
    items = get_collection(collection)
    for item in items:
        match = all(item.get(k) == v for k, v in query.items())
        if match:
            return copy.deepcopy(item)
    return None

def find_many(collection: str, query: Dict = None, limit: int = None) -> List[Dict]:
    items = get_collection(collection)
    if query:
        items = [item for item in items if all(item.get(k) == v for k, v in query.items())]
    if limit:
        items = items[:limit]
    return copy.deepcopy(items)

def insert_one(collection: str, doc: Dict) -> str:
    store = get_store()
    if collection not in store:
        store[collection] = []
    store[collection].append(copy.deepcopy(doc))
    return doc.get("_id", str(uuid.uuid4()))

def update_one(collection: str, query: Dict, update: Dict) -> bool:
    items = get_collection(collection)
    store = get_store()
    for i, item in enumerate(store[collection]):
        if all(item.get(k) == v for k, v in query.items()):
            store[collection][i].update(update)
            return True
    return False

def delete_one(collection: str, query: Dict) -> bool:
    store = get_store()
    for i, item in enumerate(store.get(collection, [])):
        if all(item.get(k) == v for k, v in query.items()):
            store[collection].pop(i)
            return True
    return False
