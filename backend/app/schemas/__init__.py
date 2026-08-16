"""
Pydantic v2 schemas for API request/response validation.
"""

from datetime import datetime
from pydantic import BaseModel


# ─────────────────────────────────────────
# Error schemas
# ─────────────────────────────────────────

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict = {}


class ErrorResponse(BaseModel):
    error: ErrorDetail


# ─────────────────────────────────────────
# Health
# ─────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    version: str
    market_status: str
    timestamp: datetime
