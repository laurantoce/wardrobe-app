from app.exceptions import NotFoundError, ValidationError
from app.models import Garment, Outfit
from app.repositories import GarmentRepository, OutfitRepository
from app.schemas import OutfitCreate, OutfitUpdate


class OutfitService:
    def __init__(
        self, outfits: OutfitRepository, garments: GarmentRepository
    ) -> None:
        self.outfits = outfits
        self.garments = garments

    def _resolve_garments(self, user_id: int, garment_ids: list[int]) -> list[Garment]:
        """Map ids to the user's garments, rejecting any that are unknown or not theirs."""
        unique_ids = set(garment_ids)
        if not unique_ids:
            return []
        found = self.garments.list_owned(unique_ids, user_id)
        if len(found) != len(unique_ids):
            missing = sorted(unique_ids - {g.id for g in found})
            raise ValidationError(f"Unknown garment ids: {missing}")
        return found

    def create(self, user_id: int, data: OutfitCreate) -> Outfit:
        outfit = Outfit(user_id=user_id, **data.model_dump(exclude={"garment_ids"}))
        outfit.garments = self._resolve_garments(user_id, data.garment_ids)
        return self.outfits.add(outfit)

    def list(self, user_id: int) -> list[Outfit]:
        return self.outfits.list_for_user(user_id)

    def get(self, user_id: int, outfit_id: int) -> Outfit:
        outfit = self.outfits.get_for_user(outfit_id, user_id)
        if outfit is None:
            raise NotFoundError("Outfit not found")
        return outfit

    def update(self, user_id: int, outfit_id: int, data: OutfitUpdate) -> Outfit:
        outfit = self.get(user_id, outfit_id)
        fields = data.model_dump(exclude_unset=True)
        garment_ids = fields.pop("garment_ids", None)
        for field, value in fields.items():
            setattr(outfit, field, value)
        if garment_ids is not None:
            outfit.garments = self._resolve_garments(user_id, garment_ids)
        return self.outfits.save(outfit)

    def delete(self, user_id: int, outfit_id: int) -> None:
        self.outfits.delete(self.get(user_id, outfit_id))
