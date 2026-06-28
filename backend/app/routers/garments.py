from fastapi import APIRouter, File, UploadFile, status

from app.dependencies import CurrentUser, GarmentServiceDep
from app.schemas import GarmentCreate, GarmentRead, GarmentUpdate
from app.services.upload import upload_to_object_storage

router = APIRouter(prefix="/garments", tags=["garments"])


@router.post("", response_model=GarmentRead, status_code=status.HTTP_201_CREATED)
def create_garment(
    payload: GarmentCreate, user: CurrentUser, service: GarmentServiceDep
):
    return service.create(user.id, payload)


@router.get("", response_model=list[GarmentRead])
def list_garments(
    user: CurrentUser, service: GarmentServiceDep, category: str | None = None
):
    return service.list(user.id, category)


@router.get("/{garment_id}", response_model=GarmentRead)
def get_garment(garment_id: int, user: CurrentUser, service: GarmentServiceDep):
    return service.get(user.id, garment_id)


@router.patch("/{garment_id}", response_model=GarmentRead)
def update_garment(
    garment_id: int,
    payload: GarmentUpdate,
    user: CurrentUser,
    service: GarmentServiceDep,
):
    return service.update(user.id, garment_id, payload)


@router.delete("/{garment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_garment(garment_id: int, user: CurrentUser, service: GarmentServiceDep):
    service.delete(user.id, garment_id)


@router.put("/{garment_id}/photo", response_model=GarmentRead)
async def replace_garment_photo(
    garment_id: int,
    user: CurrentUser,
    service: GarmentServiceDep,
    file: UploadFile = File(...),
):
    image_bytes = await file.read()
    url = upload_to_object_storage(image_bytes, file.content_type or "image/jpeg")
    return service.update(user.id, garment_id, GarmentUpdate(image_url=url))


@router.delete("/{garment_id}/photo", response_model=GarmentRead)
def delete_garment_photo(garment_id: int, user: CurrentUser, service: GarmentServiceDep):
    return service.update(user.id, garment_id, GarmentUpdate(image_url=None))
