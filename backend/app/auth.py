from functools import lru_cache
from typing import Any

import httpx
from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.config import settings


class SigningKeyNotFoundError(Exception):
    pass


def credentials_exception(detail: str = "Invalid authentication credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


@lru_cache(maxsize=1)
def _get_jwks() -> dict[str, Any]:
    try:
        response = httpx.get(settings.keycloak_jwks_url, timeout=5.0)
        response.raise_for_status()
        jwks = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable",
        ) from exc

    if not isinstance(jwks.get("keys"), list):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service returned invalid JWKS",
        )

    return jwks


def _get_signing_key(token: str) -> dict[str, Any]:
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise credentials_exception() from exc

    kid = header.get("kid")
    if not kid:
        raise credentials_exception()

    for key in _get_jwks()["keys"]:
        if key.get("kid") == kid:
            return key

    raise SigningKeyNotFoundError


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(
            token,
            _get_signing_key(token),
            algorithms=[settings.keycloak_algorithm],
            audience=settings.keycloak_audience,
            issuer=settings.keycloak_issuer,
        )
    except SigningKeyNotFoundError:
        _get_jwks.cache_clear()

    try:
        return jwt.decode(
            token,
            _get_signing_key(token),
            algorithms=[settings.keycloak_algorithm],
            audience=settings.keycloak_audience,
            issuer=settings.keycloak_issuer,
        )
    except (JWTError, SigningKeyNotFoundError) as exc:
        raise credentials_exception() from exc
