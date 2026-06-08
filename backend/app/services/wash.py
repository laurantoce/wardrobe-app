from app.exceptions import NotFoundError, ValidationError
from app.models import Wash
from app.repositories import GarmentRepository, WashRepository
from app.schemas import WashCreate


class WashService:
    def __init__(
        self, washes: WashRepository, garments: GarmentRepository
    ) -> None:
        self.washes = washes
        self.garments = garments

    def create(self, user_id: int, data: WashCreate) -> Wash:
        if not self.garments.exists_for_user(data.garment_id, user_id):
            raise ValidationError(f"Unknown garment id: {data.garment_id}")
        return self.washes.add(Wash(user_id=user_id, **data.model_dump()))

    def list(self, user_id: int, garment_id: int | None = None) -> list[Wash]:
        return self.washes.list_for_user(user_id, garment_id)

    def delete(self, user_id: int, wash_id: int) -> None:
        wash = self.washes.get_for_user(wash_id, user_id)
        if wash is None:
            raise NotFoundError("Wash not found")
        self.washes.delete(wash)
