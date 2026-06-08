from fastapi import APIRouter, status

from app.dependencies import CurrentUser, WearServiceDep
from app.schemas import WearCreate, WearRead

router = APIRouter(prefix="/wears", tags=["wears"])


@router.post("", response_model=WearRead, status_code=status.HTTP_201_CREATED)
def log_wear(payload: WearCreate, user: CurrentUser, service: WearServiceDep):
    return service.create(user.id, payload)


@router.get("", response_model=list[WearRead])
def list_wears(
    user: CurrentUser,
    service: WearServiceDep,
    garment_id: int | None = None,
    outfit_id: int | None = None,
):
    return service.list(user.id, garment_id, outfit_id)


@router.delete("/{wear_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wear(wear_id: int, user: CurrentUser, service: WearServiceDep):
    service.delete(user.id, wear_id)
