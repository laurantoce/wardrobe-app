"""Local image-processing helpers for garment photos."""

from dataclasses import dataclass
from functools import lru_cache

from app.config import settings
from app.exceptions import ExternalServiceError


@dataclass(frozen=True)
class ProcessedImage:
    image_bytes: bytes
    mime_type: str = "image/png"


def remove_background(image_bytes: bytes) -> ProcessedImage | None:
    """Return a transparent PNG cutout, or None when the feature is disabled."""
    if not settings.background_removal_enabled:
        return None

    try:
        from rembg import remove
    except ImportError as exc:
        raise ExternalServiceError(
            'Background removal is not installed. Install the backend dependency "rembg[cpu]".'
        ) from exc

    try:
        output = remove(
            image_bytes,
            session=_background_session(settings.background_removal_model),
            force_return_bytes=True,
        )
        return ProcessedImage(image_bytes=output)
    except Exception as exc:
        raise ExternalServiceError(f"Background removal failed: {exc}") from exc


@lru_cache(maxsize=4)
def _background_session(model_name: str):
    from rembg import new_session

    return new_session(model_name)