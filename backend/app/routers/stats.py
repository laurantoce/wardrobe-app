"""Read-only analytics over a user's wardrobe.

Endpoints accept an optional `start`/`end` date window (YYYY-MM-DD). Time-series
endpoints group by `period` (day / week / month / year)."""
from datetime import date
from typing import Literal

from fastapi import APIRouter

from app.dependencies import CurrentUser, StatsServiceDep
from app.schemas import (
    CategorySpending,
    ColorUsage,
    SpendingPoint,
    WardrobeSummary,
)

router = APIRouter(prefix="/stats", tags=["stats"])

Period = Literal["day", "week", "month", "year"]


@router.get("/summary", response_model=WardrobeSummary)
def summary(
    user: CurrentUser,
    service: StatsServiceDep,
    start: date | None = None,
    end: date | None = None,
):
    return service.summary(user.id, start, end)


@router.get("/spending-by-category", response_model=list[CategorySpending])
def spending_by_category(
    user: CurrentUser,
    service: StatsServiceDep,
    start: date | None = None,
    end: date | None = None,
):
    return service.spending_by_category(user.id, start, end)


@router.get("/colors", response_model=list[ColorUsage])
def color_usage(user: CurrentUser, service: StatsServiceDep):
    return service.colors(user.id)


@router.get("/spending-over-time", response_model=list[SpendingPoint])
def spending_over_time(
    user: CurrentUser,
    service: StatsServiceDep,
    period: Period = "month",
    start: date | None = None,
    end: date | None = None,
):
    return service.spending_over_time(user.id, period, start, end)
