from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models import Outfit
from app.repositories.base import BaseRepository


class OutfitRepository(BaseRepository[Outfit]):
    model = Outfit

    def get_for_user(self, outfit_id: int, user_id: int) -> Outfit | None:
        return self.db.scalar(
            select(Outfit)
            .where(Outfit.id == outfit_id, Outfit.user_id == user_id)
            .options(selectinload(Outfit.garments))
        )

    def list_for_user(self, user_id: int) -> list[Outfit]:
        return list(
            self.db.scalars(
                select(Outfit)
                .where(Outfit.user_id == user_id)
                .options(selectinload(Outfit.garments))
                .order_by(Outfit.created_at.desc())
            )
        )
