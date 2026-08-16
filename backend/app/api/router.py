from fastapi import APIRouter
from app.api.routes import health, stocks, screener, mutual_funds, portfolio

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(stocks.router)
api_router.include_router(screener.router)
api_router.include_router(mutual_funds.router)
api_router.include_router(portfolio.router)


