"""Dependency-injection wiring: Session -> repositories -> services.

Routers depend only on the ``*ServiceDep`` and ``CurrentUser`` aliases defined here, so
construction details stay in one place and are easy to override in tests.
"""
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.ai.client import GeminiClient, LLMClient
from app.auth import credentials_exception, decode_access_token
from app.config import settings
from app.database import get_db
from app.models import User
from app.repositories import (
    GarmentRepository,
    OutfitRepository,
    StatsRepository,
    UserRepository,
)
from app.services import (
    AIService,
    GarmentService,
    OutfitService,
    StatsService,
)

DbSession = Annotated[Session, Depends(get_db)]
BearerCredentials = Annotated[
    HTTPAuthorizationCredentials | None,
    Depends(HTTPBearer(auto_error=False)),
]

DEMO_USER_EMAIL = "demo@wardrobe.local"


# --- repositories ---------------------------------------------------------------
def get_user_repository(db: DbSession) -> UserRepository:
    return UserRepository(db)


def get_garment_repository(db: DbSession) -> GarmentRepository:
    return GarmentRepository(db)


def get_outfit_repository(db: DbSession) -> OutfitRepository:
    return OutfitRepository(db)


def get_stats_repository(db: DbSession) -> StatsRepository:
    return StatsRepository(db)


# --- current user ---------------------------------------------------------------
def get_current_user(
    users: Annotated[UserRepository, Depends(get_user_repository)],
    credentials: BearerCredentials,
) -> User:
    if settings.auth_mode == "demo":
        return users.get_or_create_demo(DEMO_USER_EMAIL)

    if credentials is None:
        raise credentials_exception("Not authenticated")

    claims = decode_access_token(credentials.credentials)
    email = claims.get("email")
    if not isinstance(email, str) or not email.strip():
        raise credentials_exception("Token is missing an email claim")

    return users.get_or_create_by_email(email.strip().lower())


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


def get_stats_service(
    stats: Annotated[StatsRepository, Depends(get_stats_repository)],
) -> StatsService:
    return StatsService(stats)


GarmentServiceDep = Annotated[GarmentService, Depends(get_garment_service)]
OutfitServiceDep = Annotated[OutfitService, Depends(get_outfit_service)]
StatsServiceDep = Annotated[StatsService, Depends(get_stats_service)]


# --- AI -------------------------------------------------------------------------
def get_llm_client() -> LLMClient | None:
    if not settings.gemini_api_key:
        return None
    return GeminiClient(settings.gemini_api_key)


def get_ai_service(
    garments: Annotated[GarmentRepository, Depends(get_garment_repository)],
    llm: Annotated[LLMClient | None, Depends(get_llm_client)],
) -> AIService:
    return AIService(garments, llm)


AIServiceDep = Annotated[AIService, Depends(get_ai_service)]
