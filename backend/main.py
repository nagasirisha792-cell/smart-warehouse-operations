"""
WareMind AI – FastAPI Main Application (Production Ready)
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from routers.dashboard import router as dashboard_router
from routers.orders import router as orders_router
from routers.inventory import router as inventory_router
from routers.all_routers import (
    picking_router,
    packing_router,
    qc_router,
    exceptions_router,
    dispatch_router,
    analytics_router,
    notifications_router,
    simulation_router,
    copilot_router,
)

app = FastAPI(
    title="WareMind AI",
    description="Intelligent Warehouse Operations & Order Fulfillment System",
    version="1.0.0",
)

# CORS – Allow all origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(dashboard_router)
app.include_router(orders_router)
app.include_router(inventory_router)
app.include_router(picking_router)
app.include_router(packing_router)
app.include_router(qc_router)
app.include_router(exceptions_router)
app.include_router(dispatch_router)
app.include_router(analytics_router)
app.include_router(notifications_router)
app.include_router(simulation_router)
app.include_router(copilot_router)


@app.get("/api/health")
def health():
    from database.mock_db import get_collection
    orders = get_collection("orders")
    inventory = get_collection("inventory")
    return {
        "status": "healthy",
        "database": "mock_in_memory",
        "orders_loaded": len(orders),
        "inventory_loaded": len(inventory),
    }


@app.post("/api/auth/login")
def login(body: dict):
    from database.mock_db import find_one
    username = body.get("username", "")
    password = body.get("password", "")
    user = find_one("users", {"username": username})
    if not user or user.get("password") != password:
        raise HTTPException(401, "Invalid credentials")
    return {
        "access_token": f"mock-token-{user['_id']}",
        "token_type": "bearer",
        "user": {
            "id": user["_id"],
            "name": user["name"],
            "role": user["role"],
            "email": user["email"],
            "warehouse": user.get("warehouse", "WH-001"),
        },
    }


# Serve React Static Dist in Production
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow /api routes to be handled by FastAPI routers
        if full_path.startswith("api/"):
            raise HTTPException(404, "API endpoint not found")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "product": "WareMind AI",
            "status": "operational",
            "note": "Frontend dist build not found. Run 'npm run build' in frontend directory.",
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
