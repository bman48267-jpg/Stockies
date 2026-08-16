"""
Stockies FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.db.database import engine, Base
from app.db import models  # noqa: F401 — register all models
from app.api.router import api_router


# ─────────────────────────────────────────
# Lifespan
# ─────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("Starting Stockies backend...")

    # Create all tables (dev convenience — use Alembic in production)
    if settings.is_development:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified / created.")

    yield

    logger.info("Stockies backend shutting down.")


# ─────────────────────────────────────────
# App
# ─────────────────────────────────────────

app = FastAPI(
    title="Stockies API",
    description=(
        "Professional Indian stock and mutual fund research platform. "
        "Provides market data, screening, analytics, and portfolio tracking."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ─────────────────────────────────────────
# CORS
# ─────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────
# Global exception handlers
# ─────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(
        "Unhandled exception: %s %s → %s: %s",
        request.method,
        request.url.path,
        type(exc).__name__,
        str(exc),
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "internal_server_error",
                "message": "An unexpected error occurred. Please try again later.",
                "details": {},
            }
        },
    )


# ─────────────────────────────────────────
# Routers
# ─────────────────────────────────────────

app.include_router(api_router)


# ─────────────────────────────────────────
# Root redirect
# ─────────────────────────────────────────

@app.get("/", include_in_schema=False)
def root():
    return {"service": "Stockies API", "docs": "/docs", "health": "/api/v1/health"}
