from fastapi import APIRouter, status

from app.dependencies import CurrentUser, OutfitServiceDep
from app.schemas import OutfitCreate, OutfitRead, OutfitUpdate

router = APIRouter(prefix="/outfits", tags=["outfits"])


@router.post("", response_model=OutfitRead, status_code=status.HTTP_201_CREATED)
def create_outfit(payload: OutfitCreate, user: CurrentUser, service: OutfitServiceDep):
    return service.create(user.id, payload)


@router.get("", response_model=list[OutfitRead])
def list_outfits(user: CurrentUser, service: OutfitServiceDep):
    return service.list(user.id)


@router.get("/{outfit_id}", response_model=OutfitRead)
def get_outfit(outfit_id: int, user: CurrentUser, service: OutfitServiceDep):
    return service.get(user.id, outfit_id)


@router.patch("/{outfit_id}", response_model=OutfitRead)
def update_outfit(
    outfit_id: int,
    payload: OutfitUpdate,
    user: CurrentUser,
    service: OutfitServiceDep,
):
    return service.update(user.id, outfit_id, payload)


@router.delete("/{outfit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_outfit(outfit_id: int, user: CurrentUser, service: OutfitServiceDep):
    service.delete(user.id, outfit_id)
