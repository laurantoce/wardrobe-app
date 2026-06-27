from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.exceptions import ExternalServiceError, NotFoundError, ValidationError
from app.routers import ai, garments, outfits, stats

app = FastAPI(
    title="Wardrobe App API",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Translate domain errors into HTTP responses so services stay framework-agnostic.
@app.exception_handler(NotFoundError)
def handle_not_found(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND, content={"detail": str(exc)}
    )


@app.exception_handler(ValidationError)
def handle_validation(request: Request, exc: ValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)}
    )


@app.exception_handler(ExternalServiceError)
def handle_external_service(request: Request, exc: ExternalServiceError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content={"detail": str(exc)}
    )


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(garments.router)
app.include_router(outfits.router)
app.include_router(stats.router)
app.include_router(ai.router)
