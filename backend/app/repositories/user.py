from sqlalchemy import select

from app.models import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email))

    def get_or_create_by_email(self, email: str) -> User:
        user = self.get_by_email(email)
        if user is None:
            user = self.add(User(email=email, password_hash=""))
        return user

    def get_or_create_demo(self, email: str) -> User:
        """Used by the stubbed auth layer until real authentication exists."""
        return self.get_or_create_by_email(email)
