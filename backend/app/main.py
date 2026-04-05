"""Makkanwala FastAPI Application – main entry point."""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.api.routes import auth, products, cart, orders, payments, admin

# ─── Static files directory ────────────────────────────────────
STATIC_DIR = Path("static")
PRODUCT_IMAGES_DIR = STATIC_DIR / "products"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create required directories on startup."""
    PRODUCT_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    yield

# ─── Rate Limiter ──────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

# ─── App Factory ───────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description="🧈 Makkanwala – Fresh Butter Ordering Platform",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# ─── State ─────────────────────────────────────────────────────
app.state.limiter = limiter

# ─── Exception Handlers ───────────────────────────────────────
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── Middleware ────────────────────────────────────────────────
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(admin.router)

# ─── Static Files ─────────────────────────────────────────────
# Served at: GET /static/products/<filename>
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# ─── Health Check ──────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}
