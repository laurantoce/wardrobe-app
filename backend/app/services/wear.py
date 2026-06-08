from app.exceptions import NotFoundError, ValidationError
from app.models import Wear
from app.repositories import GarmentRepository, OutfitRepository, WearRepository
from app.schemas import WearCreate


class WearService:
    def __init__(
        self,
        wears: WearRepository,
        garments: GarmentRepository,
        outfits: OutfitRepository,
    ) -> None:
        self.wears = wears
        self.garments = garments
        self.outfits = outfits

    def create(self, user_id: int, data: WearCreate) -> Wear:
        if data.garment_id is not None and not self.garments.exists_for_user(
            data.garment_id, user_id
        ):
            raise ValidationError(f"Unknown garment id: {data.garment_id}")
        if data.outfit_id is not None and not self.outfits.exists_for_user(
            data.outfit_id, user_id
        ):
            raise ValidationError(f"Unknown outfit id: {data.outfit_id}")
        return self.wears.add(Wear(user_id=user_id, **data.model_dump()))

    def list(
        self,
        user_id: int,
        garment_id: int | None = None,
        outfit_id: int | None = None,
    ) -> list[Wear]:
        return self.wears.list_for_user(user_id, garment_id, outfit_id)

    def delete(self, user_id: int, wear_id: int) -> None:
        wear = self.wears.get_for_user(wear_id, user_id)
        if wear is None:
            raise NotFoundError("Wear not found")
        self.wears.delete(wear)
