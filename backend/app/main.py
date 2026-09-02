"""
VAR VPN API - Main Application Entry Point
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.database import init_db_pool
from app.api.v1.endpoints import router as v1_router

# Initialize FastAPI app
app = FastAPI(
    title="VAR VPN API",
    description="Telegram Mini App Backend for VAR VPN",
    version="1.0.0",
    docs_url="/docs" if settings.fastapi_env != "production" else None,
    redoc_url="/redoc" if settings.fastapi_env != "production" else None,
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "https://varminiapp.popserver.shop",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions gracefully."""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.fastapi_env != "production" else None
        }
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database connection pool on startup."""
    init_db_pool()
    print(f"VAR API started on {settings.fastapi_host}:{settings.fastapi_port}")


# Include API routers
app.include_router(v1_router, prefix="/v1")


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "service": "VAR VPN API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/v1/health",
            "plans": "/v1/plans",
            "account_status": "/v1/account/status",
        }
    }
