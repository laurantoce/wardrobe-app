"""Dependency-injection wiring: Session -> repositories -> services.

Routers depend only on the ``*ServiceDep`` and ``CurrentUser`` aliases defined here, so
construction details stay in one place and are easy to override in tests.
"""
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.repositories import (
    GarmentRepository,
    OutfitRepository,
    StatsRepository,
    UserRepository,
    WashRepository,
    WearRepository,
)
from app.services import (
    GarmentService,
    OutfitService,
    StatsService,
    WashService,
    WearService,
)

DbSession = Annotated[Session, Depends(get_db)]

# Until real auth exists, "the current user" is a single demo user, created on first use.
DEMO_USER_EMAIL = "demo@wardrobe.local"


# --- repositories ---------------------------------------------------------------
def get_user_repository(db: DbSession) -> UserRepository:
    return UserRepository(db)


def get_garment_repository(db: DbSession) -> GarmentRepository:
    return GarmentRepository(db)


def get_outfit_repository(db: DbSession) -> OutfitRepository:
    return OutfitRepository(db)


def get_wear_repository(db: DbSession) -> WearRepository:
    return WearRepository(db)


def get_wash_repository(db: DbSession) -> WashRepository:
    return WashRepository(db)


def get_stats_repository(db: DbSession) -> StatsRepository:
    return StatsRepository(db)


# --- current user (STUBBED auth) -------------------------------------------------
def get_current_user(
    users: Annotated[UserRepository, Depends(get_user_repository)],
) -> User:
    # TODO(auth): replace with JWT-based authentication.
    return users.get_or_create_demo(DEMO_USER_EMAIL)


CurrentUser = Annotated[User, Depends(get_current_user)]


# --- services --------------------------------------------------------------------
def get_garment_service(
    garments: Annotated[GarmentRepository, Depends(get_garment_repository)],
) -> GarmentService:
    return GarmentService(garments)


def get_outfit_service(
    outfits: Annotated[OutfitRepository, Depends(get_outfit_repository)],
    garments: Annotated[GarmentRepository, Depends(get_garment_repository)],
) -> OutfitService:
    return OutfitService(outfits, garments)


def get_wear_service(
    wears: Annotated[WearRepository, Depends(get_wear_repository)],
    garments: Annotated[GarmentRepository, Depends(get_garment_repository)],
    outfits: Annotated[OutfitRepository, Depends(get_outfit_repository)],
) -> WearService:
    return WearService(wears, garments, outfits)


def get_wash_service(
    washes: Annotated[WashRepository, Depends(get_wash_repository)],
    garments: Annotated[GarmentRepository, Depends(get_garment_repository)],
) -> WashService:
    return WashService(washes, garments)


def get_stats_service(
    stats: Annotated[StatsRepository, Depends(get_stats_repository)],
) -> StatsService:
    return StatsService(stats)


GarmentServiceDep = Annotated[GarmentService, Depends(get_garment_service)]
OutfitServiceDep = Annotated[OutfitService, Depends(get_outfit_service)]
WearServiceDep = Annotated[WearService, Depends(get_wear_service)]
WashServiceDep = Annotated[WashService, Depends(get_wash_service)]
StatsServiceDep = Annotated[StatsService, Depends(get_stats_service)]
