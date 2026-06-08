from app.exceptions import NotFoundError
from app.models import Garment
from app.repositories import GarmentRepository
from app.schemas import GarmentCreate, GarmentUpdate


class GarmentService:
    def __init__(self, garments: GarmentRepository) -> None:
        self.garments = garments

    def create(self, user_id: int, data: GarmentCreate) -> Garment:
        return self.garments.add(Garment(user_id=user_id, **data.model_dump()))

    def list(self, user_id: int, category: str | None = None) -> list[Garment]:
        return self.garments.list_for_user(user_id, category)

    def get(self, user_id: int, garment_id: int) -> Garment:
        garment = self.garments.get_for_user(garment_id, user_id)
        if garment is None:
            raise NotFoundError("Garment not found")
        return garment

    def update(self, user_id: int, garment_id: int, data: GarmentUpdate) -> Garment:
        garment = self.get(user_id, garment_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(garment, field, value)
        return self.garments.save(garment)

    def delete(self, user_id: int, garment_id: int) -> None:
        self.garments.delete(self.get(user_id, garment_id))
