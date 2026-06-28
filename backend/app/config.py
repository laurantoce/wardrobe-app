from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    auth_mode: Literal["demo", "keycloak"] = "keycloak"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    gemini_api_key: str = ""
    keycloak_issuer: str = "http://localhost:8080/realms/wardrobe"
    keycloak_jwks_url: str = (
        "http://localhost:8080/realms/wardrobe/protocol/openid-connect/certs"
    )
    keycloak_audience: str = "wardrobe-api"
    keycloak_algorithm: str = "RS256"
    object_storage_endpoint: str = ""
    object_storage_public_url: str = ""
    object_storage_access_key: str = ""
    object_storage_secret_key: str = ""
    object_storage_bucket: str = "localhost"
    object_storage_region: str = "garage"

    class Config:
        env_file = ".env"

settings = Settings()
