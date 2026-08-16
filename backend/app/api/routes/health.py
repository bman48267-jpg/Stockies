from datetime import datetime
from fastapi import APIRouter
from app.schemas import HealthResponse
from app.utils.market import get_market_status, now_ist

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns server status and current Indian market status.",
)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        version="1.0.0",
        market_status=get_market_status(),
        timestamp=now_ist(),
    )
