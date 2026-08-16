"""
Mutual Funds API routes.

Endpoints:
  GET /api/v1/mutual-funds/search?q=PPFAS&limit=15
  GET /api/v1/mutual-funds/popular
  GET /api/v1/mutual-funds/{scheme_code}/details
  GET /api/v1/mutual-funds/{scheme_code}/nav-history?period=1y
  POST /api/v1/mutual-funds/compare
  POST /api/v1/mutual-funds/overlap
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from app.utils import mfapi_adapter
from app.calculations.mf_metrics import calculate_portfolio_overlap
from app.utils.market import now_ist
from app.schemas.mutual_fund import (
    MFSearchResult,
    MFSearchResponse,
    MFSchemeDetailResponse,
    NAVHistoryPoint,
    MFNAVHistoryResponse,
    MFCompareRequest,
    MFCompareResponse,
    MFOverlapRequest,
    MFOverlapResponse,
    CommonHoldingItem,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mutual-funds", tags=["mutual-funds"])


@router.get(
    "/search",
    response_model=MFSearchResponse,
    summary="Search mutual fund schemes",
)
def search_mutual_funds(
    q: Annotated[str, Query(description="Search query")] = "",
    limit: Annotated[int, Query(ge=1, le=50)] = 15,
) -> MFSearchResponse:
    """Search mutual fund schemes by name or AMC using MFAPI.in."""
    try:
        raw = mfapi_adapter.search_mf(q, limit=limit)
    except Exception as exc:
        logger.error("MF search error for query '%s': %s", q, exc)
        raise HTTPException(status_code=502, detail="Mutual fund search service unavailable") from exc

    results = [MFSearchResult(**r) for r in raw]
    return MFSearchResponse(query=q, results=results, count=len(results))


@router.get(
    "/popular",
    response_model=list[MFSchemeDetailResponse],
    summary="Get popular mutual funds",
)
def get_popular_mutual_funds() -> list[MFSchemeDetailResponse]:
    """Get curated list of popular mutual funds with full detail."""
    pop_codes = ["122639", "119063", "119598", "125497", "120503"]
    output = []
    for code in pop_codes:
        try:
            details = mfapi_adapter.get_mf_details(code)
            output.append(MFSchemeDetailResponse(**details))
        except Exception as exc:
            logger.warning("Failed to fetch popular scheme %s: %s", code, exc)

    return output


@router.get(
    "/{scheme_code}/details",
    response_model=MFSchemeDetailResponse,
    summary="Get mutual fund scheme details",
)
def get_scheme_details(scheme_code: str) -> MFSchemeDetailResponse:
    """Fetch details, NAV, CAGR returns, and top holdings for a scheme."""
    try:
        data = mfapi_adapter.get_mf_details(scheme_code)
    except ValueError as exc:
        logger.warning("Scheme details not found for %s: %s", scheme_code, exc)
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Scheme detail error for %s: %s", scheme_code, exc)
        raise HTTPException(status_code=502, detail="Market data service unavailable") from exc

    return MFSchemeDetailResponse(**data)


@router.get(
    "/{scheme_code}/nav-history",
    response_model=MFNAVHistoryResponse,
    summary="Get scheme NAV history",
)
def get_nav_history(
    scheme_code: str,
    period: Annotated[str, Query(description="1m, 6m, 1y, 3y, 5y, max")] = "1y",
) -> MFNAVHistoryResponse:
    """Fetch historical NAV points for charting."""
    valid_periods = {"1m", "6m", "1y", "3y", "5y", "max"}
    if period.lower() not in valid_periods:
        raise HTTPException(status_code=422, detail=f"Invalid period. Must be one of {valid_periods}")

    try:
        details = mfapi_adapter.get_mf_details(scheme_code)
        history = mfapi_adapter.get_mf_nav_history(scheme_code, period=period)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("NAV history error for %s: %s", scheme_code, exc)
        raise HTTPException(status_code=502, detail="Market data service unavailable") from exc

    points = [NAVHistoryPoint(**pt) for pt in history]
    return MFNAVHistoryResponse(
        scheme_code=scheme_code,
        scheme_name=details["scheme_name"],
        period=period,
        data=points,
        count=len(points),
    )


@router.post(
    "/compare",
    response_model=MFCompareResponse,
    summary="Compare multiple mutual fund schemes",
)
def compare_schemes(body: MFCompareRequest) -> MFCompareResponse:
    """Compare 2 to 4 mutual fund schemes side-by-side."""
    schemes = []
    for code in body.scheme_codes:
        try:
            d = mfapi_adapter.get_mf_details(code)
            schemes.append(MFSchemeDetailResponse(**d))
        except Exception as exc:
            logger.warning("Could not fetch scheme %s for comparison: %s", code, exc)

    if not schemes:
        raise HTTPException(status_code=404, detail="None of the specified scheme codes could be retrieved.")

    return MFCompareResponse(schemes=schemes)


@router.post(
    "/overlap",
    response_model=MFOverlapResponse,
    summary="Calculate portfolio overlap between two schemes",
)
def calculate_overlap(body: MFOverlapRequest) -> MFOverlapResponse:
    """Calculate portfolio holdings overlap between Scheme A and Scheme B."""
    try:
        data_a = mfapi_adapter.get_mf_details(body.scheme_code_a)
        data_b = mfapi_adapter.get_mf_details(body.scheme_code_b)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Overlap fetch error: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to retrieve scheme data") from exc

    scheme_a = MFSchemeDetailResponse(**data_a)
    scheme_b = MFSchemeDetailResponse(**data_b)

    holdings_a = [h.model_dump() for h in scheme_a.top_holdings]
    holdings_b = [h.model_dump() for h in scheme_b.top_holdings]

    overlap_res = calculate_portfolio_overlap(holdings_a, holdings_b)

    common_items = [CommonHoldingItem(**item) for item in overlap_res["common_holdings"]]

    return MFOverlapResponse(
        scheme_a=scheme_a,
        scheme_b=scheme_b,
        overlap_percentage=overlap_res["overlap_percentage"],
        common_holdings_count=overlap_res["common_holdings_count"],
        common_holdings=common_items,
        unique_holdings_a_count=overlap_res["unique_holdings_a_count"],
        unique_holdings_b_count=overlap_res["unique_holdings_b_count"],
        timestamp=now_ist().isoformat(),
    )
