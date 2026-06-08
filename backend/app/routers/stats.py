from fastapi import APIRouter, Query

from app.dependencies import CurrentUser, StatsServiceDep
from app.schemas import CategorySpending, ColorUsage, GarmentUsage, WardrobeSummary

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary", response_model=WardrobeSummary)
def summary(user: CurrentUser, service: StatsServiceDep):
    return service.summary(user.id)


@router.get("/spending-by-category", response_model=list[CategorySpending])
def spending_by_category(user: CurrentUser, service: StatsServiceDep):
    return service.spending_by_category(user.id)


@router.get("/colors", response_model=list[ColorUsage])
def color_usage(user: CurrentUser, service: StatsServiceDep):
    return service.colors(user.id)


@router.get("/most-worn", response_model=list[GarmentUsage])
def most_worn(
    user: CurrentUser,
    service: StatsServiceDep,
    limit: int = Query(default=10, ge=1, le=100),
):
    return service.most_worn(user.id, limit)


@router.get("/most-washed", response_model=list[GarmentUsage])
def most_washed(
    user: CurrentUser,
    service: StatsServiceDep,
    limit: int = Query(default=10, ge=1, le=100),
):
    return service.most_washed(user.id, limit)
