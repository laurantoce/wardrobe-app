"""Read-only analytics over a user's wardrobe.

Most endpoints accept an optional `start`/`end` date window (YYYY-MM-DD), applied to
each metric's own date column. The time-series endpoints group by `period`."""
from datetime import date
from typing import Literal

from fastapi import APIRouter, Query

from app.dependencies import CurrentUser, StatsServiceDep
from app.schemas import (
    ActivityPoint,
    CategorySpending,
    ColorUsage,
    GarmentUsage,
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


@router.get("/most-worn", response_model=list[GarmentUsage])
def most_worn(
    user: CurrentUser,
    service: StatsServiceDep,
    limit: int = Query(default=10, ge=1, le=100),
    start: date | None = None,
    end: date | None = None,
):
    return service.most_worn(user.id, limit, start, end)


@router.get("/most-washed", response_model=list[GarmentUsage])
def most_washed(
    user: CurrentUser,
    service: StatsServiceDep,
    limit: int = Query(default=10, ge=1, le=100),
    start: date | None = None,
    end: date | None = None,
):
    return service.most_washed(user.id, limit, start, end)


@router.get("/spending-over-time", response_model=list[SpendingPoint])
def spending_over_time(
    user: CurrentUser,
    service: StatsServiceDep,
    period: Period = "month",
    start: date | None = None,
    end: date | None = None,
):
    return service.spending_over_time(user.id, period, start, end)


@router.get("/activity-over-time", response_model=list[ActivityPoint])
def activity_over_time(
    user: CurrentUser,
    service: StatsServiceDep,
    period: Period = "month",
    start: date | None = None,
    end: date | None = None,
):
    return service.activity_over_time(user.id, period, start, end)
