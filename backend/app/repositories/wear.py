from sqlalchemy import select

from app.models import Wear
from app.repositories.base import BaseRepository


class WearRepository(BaseRepository[Wear]):
    model = Wear

    def get_for_user(self, wear_id: int, user_id: int) -> Wear | None:
        return self.db.scalar(
            select(Wear).where(Wear.id == wear_id, Wear.user_id == user_id)
        )

    def list_for_user(
        self,
        user_id: int,
        garment_id: int | None = None,
        outfit_id: int | None = None,
    ) -> list[Wear]:
        stmt = select(Wear).where(Wear.user_id == user_id)
        if garment_id is not None:
            stmt = stmt.where(Wear.garment_id == garment_id)
        if outfit_id is not None:
            stmt = stmt.where(Wear.outfit_id == outfit_id)
        return list(self.db.scalars(stmt.order_by(Wear.worn_date.desc())))
