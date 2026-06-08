from sqlalchemy import select

from app.models import Wash
from app.repositories.base import BaseRepository


class WashRepository(BaseRepository[Wash]):
    model = Wash

    def get_for_user(self, wash_id: int, user_id: int) -> Wash | None:
        return self.db.scalar(
            select(Wash).where(Wash.id == wash_id, Wash.user_id == user_id)
        )

    def list_for_user(
        self, user_id: int, garment_id: int | None = None
    ) -> list[Wash]:
        stmt = select(Wash).where(Wash.user_id == user_id)
        if garment_id is not None:
            stmt = stmt.where(Wash.garment_id == garment_id)
        return list(self.db.scalars(stmt.order_by(Wash.washed_date.desc())))
