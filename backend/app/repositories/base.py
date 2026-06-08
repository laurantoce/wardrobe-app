from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """Generic persistence for a single model.

    Write methods own their transaction (commit + refresh) so services don't need a
    handle on the ``Session``. Each operation here is a single atomic unit of work,
    which is sufficient for this app's needs.
    """

    model: type[ModelT]

    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, obj_id: int) -> ModelT | None:
        return self.db.get(self.model, obj_id)

    def exists_for_user(self, obj_id: int, user_id: int) -> bool:
        """Cheap ownership check that avoids loading the whole row."""
        found = self.db.scalar(
            select(self.model.id).where(  # type: ignore[attr-defined]
                self.model.id == obj_id,  # type: ignore[attr-defined]
                self.model.user_id == user_id,  # type: ignore[attr-defined]
            )
        )
        return found is not None

    def add(self, obj: ModelT) -> ModelT:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def save(self, obj: ModelT) -> ModelT:
        """Persist mutations made to an already-tracked instance."""
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, obj: ModelT) -> None:
        self.db.delete(obj)
        self.db.commit()
