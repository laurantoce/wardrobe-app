from fastapi import APIRouter, File, UploadFile

from app.dependencies import AIServiceDep, CurrentUser
from app.schemas.ai import GarmentPhotoAnalysis, SuggestionRequest, SuggestionResponse

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/suggestions", response_model=SuggestionResponse)
def suggest_outfits(
    payload: SuggestionRequest, user: CurrentUser, service: AIServiceDep
):
    return service.suggest_outfits(user.id, payload)


@router.post("/analyze-garment-photo", response_model=GarmentPhotoAnalysis)
async def analyze_garment_photo(
    service: AIServiceDep,
    file: UploadFile = File(...),
    generate_cutout: bool = True,
):
    image_bytes = await file.read()
    return service.analyze_garment_photo(
        image_bytes, file.content_type or "image/jpeg", generate_cutout
    )
