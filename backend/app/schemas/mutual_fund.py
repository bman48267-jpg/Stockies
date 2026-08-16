"""
Pydantic v2 schemas for the Mutual Funds API.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class MFSearchResult(BaseModel):
    scheme_code: str
    scheme_name: str
    amc: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    nav: Optional[float] = None
    change_percent: Optional[float] = None


class MFSearchResponse(BaseModel):
    query: str
    results: list[MFSearchResult]
    count: int


class MFHoldingItem(BaseModel):
    security_name: str
    isin: Optional[str] = None
    sector: Optional[str] = None
    weight: float  # Percentage e.g. 8.45


class MFSchemeDetailResponse(BaseModel):
    scheme_code: str
    scheme_name: str
    amc: str
    category: str
    sub_category: Optional[str] = None
    plan: str = "Direct"
    option: str = "Growth"
    benchmark: Optional[str] = None
    current_nav: float
    previous_nav: Optional[float] = None
    nav_date: str
    change: Optional[float] = None
    change_percent: Optional[float] = None
    cagr_1y: Optional[float] = None
    cagr_3y: Optional[float] = None
    cagr_5y: Optional[float] = None
    cagr_inception: Optional[float] = None
    expense_ratio: Optional[float] = None
    aum: Optional[float] = None  # in Cr
    risk_level: Optional[str] = None
    top_holdings: list[MFHoldingItem] = []
    sector_breakdown: dict[str, float] = {}
    updated_at: str


class NAVHistoryPoint(BaseModel):
    date: str
    nav: float


class MFNAVHistoryResponse(BaseModel):
    scheme_code: str
    scheme_name: str
    period: str
    data: list[NAVHistoryPoint]
    count: int


class MFCompareRequest(BaseModel):
    scheme_codes: list[str] = Field(min_length=2, max_length=4)



class MFCompareResponse(BaseModel):
    schemes: list[MFSchemeDetailResponse]


class MFOverlapRequest(BaseModel):
    scheme_code_a: str
    scheme_code_b: str


class CommonHoldingItem(BaseModel):
    security_name: str
    sector: Optional[str] = None
    weight_in_a: float
    weight_in_b: float
    overlap_weight: float


class MFOverlapResponse(BaseModel):
    scheme_a: MFSchemeDetailResponse
    scheme_b: MFSchemeDetailResponse
    overlap_percentage: float  # Total holdings overlap %
    common_holdings_count: int
    common_holdings: list[CommonHoldingItem]
    unique_holdings_a_count: int
    unique_holdings_b_count: int
    timestamp: str
