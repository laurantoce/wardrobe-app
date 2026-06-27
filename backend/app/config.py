from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    gemini_api_key: str = ""
    minio_endpoint: str = ""      # internal: http://minio:9000
    minio_public_url: str = ""    # browser-reachable: http://localhost:9000
    minio_access_key: str = ""
    minio_secret_key: str = ""
    minio_bucket: str = "wardrobe"

    class Config:
        env_file = ".env"

settings = Settings()