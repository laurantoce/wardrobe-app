from fastapi import APIRouter, status

from app.dependencies import CurrentUser, WashServiceDep
from app.schemas import WashCreate, WashRead

router = APIRouter(prefix="/washes", tags=["washes"])


@router.post("", response_model=WashRead, status_code=status.HTTP_201_CREATED)
def log_wash(payload: WashCreate, user: CurrentUser, service: WashServiceDep):
    return service.create(user.id, payload)


@router.get("", response_model=list[WashRead])
def list_washes(
    user: CurrentUser, service: WashServiceDep, garment_id: int | None = None
):
    return service.list(user.id, garment_id)


@router.delete("/{wash_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wash(wash_id: int, user: CurrentUser, service: WashServiceDep):
    service.delete(user.id, wash_id)
