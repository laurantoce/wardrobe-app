from sqlalchemy import select

from app.models import Garment
from app.repositories.base import BaseRepository


class GarmentRepository(BaseRepository[Garment]):
    model = Garment

    def get_for_user(self, garment_id: int, user_id: int) -> Garment | None:
        return self.db.scalar(
            select(Garment).where(
                Garment.id == garment_id, Garment.user_id == user_id
            )
        )

    def list_for_user(
        self, user_id: int, category: str | None = None
    ) -> list[Garment]:
        stmt = select(Garment).where(Garment.user_id == user_id)
        if category is not None:
            stmt = stmt.where(Garment.category == category)
        return list(self.db.scalars(stmt.order_by(Garment.created_at.desc())))

    def list_owned(self, garment_ids: set[int], user_id: int) -> list[Garment]:
        """Return the user's garments matching the given ids (may be fewer if some
        ids are unknown or owned by someone else)."""
        if not garment_ids:
            return []
        return list(
            self.db.scalars(
                select(Garment).where(
                    Garment.id.in_(garment_ids), Garment.user_id == user_id
                )
            )
        )
