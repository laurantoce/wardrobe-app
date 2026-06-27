from fastapi import APIRouter

from app.dependencies import AIServiceDep, CurrentUser
from app.schemas.ai import SuggestionRequest, SuggestionResponse

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/suggestions", response_model=SuggestionResponse)
def suggest_outfits(
    payload: SuggestionRequest, user: CurrentUser, service: AIServiceDep
):
    return service.suggest_outfits(user.id, payload)
