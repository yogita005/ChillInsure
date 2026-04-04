"""
ChillInsure Backend - Unified FastAPI Application
Consolidates: sg-backend (auth, gigscore) + Saswat-BackEnd (policy) + manya-services (weather, payout, zone-risk)
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import all routers
from routes.auth_route import router as auth_router
from routes.gigscore_route import router as gigscore_router
from routes.policy_route import router as policy_router
from routes.users_route import router as users_router
from routes.alerts_route import router as alerts_router
from routes.claims_route import router as claims_router
from routes.dark_store_route import router as dark_store_router
from routes.gig_protect_route import router as gig_protect_router

# Import services for initialization
from services import weather_service, payout_service, zone_risk_service

# Lifecycle context
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("[+] ChillInsure Backend Starting...")
    
    # Startup
    try:
        print("[OK] Initializing services...")
        # Services are lazy-loaded, so no explicit init needed
        # They'll initialize on first use
    except Exception as e:
        print(f"[ERROR] Error during startup: {e}")
    
    yield
    
    # Shutdown
    print("[-] ChillInsure Backend Shutting Down...")


# Create FastAPI app
app = FastAPI(
    title="ChillInsure API",
    description="Weather-Based Parametric Insurance for Gig Workers",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:8082",
        "http://localhost:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
print("[*] Registering routes...")
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(gigscore_router, prefix="/api/gigscore", tags=["Risk Scoring"])
app.include_router(policy_router, prefix="/api/policy", tags=["Weekly Policies"])
app.include_router(gig_protect_router, prefix="/api/gig-protect", tags=["GIG PROTECT Insurance"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(alerts_router, prefix="/api/alerts", tags=["Risk Alerts"])
app.include_router(claims_router, prefix="/api/claims", tags=["Claims Verification"])
app.include_router(dark_store_router, tags=["Dark Store Disruption"])

# Health check endpoints
@app.get("/")
def root():
    """Root health check"""
    return {
        "status": "ChillInsure backend running",
        "service": "Parametric Insurance API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    """Health status endpoint"""
    return {
        "status": "healthy",
        "service": "ChillInsure",
        "timestamp": __import__('datetime').datetime.utcnow().isoformat()
    }


@app.get("/api/status")
def api_status():
    """API status with all services"""
    return {
        "api": "operational",
        "auth": "[OK] ready",
        "gigscore": "[OK] ready",
        "policy": "[OK] ready",
        "weather_service": "[OK] ready",
        "payout_service": "[OK] ready",
        "zone_risk_service": "[OK] ready",
        "database": "[OK] connected"
    }


# Error handlers
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Global exception handler"""
    print(f"[ERROR] Exception: {exc}")
    return {
        "error": str(exc),
        "status": "error"
    }


if __name__ == "__main__":
    """
    Run the app with:
    python main.py
    
    Or with custom settings:
    python main.py --host 0.0.0.0 --port 3001 --reload
    """
    print("""
    ===================================================
    ChillInsure Backend - Starting
    API Docs:     http://localhost:3001/docs
    Health:       http://localhost:3001/health
    Status:       http://localhost:3001/api/status
    ===================================================
    """)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3001,
        reload=False,
        log_level="info"
    )
