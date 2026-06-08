from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Wear(Base):
    __tablename__ = "wears"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    outfit_id: Mapped[int | None] = mapped_column(
        ForeignKey("outfits.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    garment_id: Mapped[int | None] = mapped_column(
        ForeignKey("garments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    worn_date: Mapped[date] = mapped_column(Date, nullable=False)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="wears")
    outfit = relationship("Outfit", back_populates="wears")
    garment = relationship("Garment", back_populates="wears")