from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Table, Text, Column, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


outfit_garments = Table(
    "outfit_garments",
    Base.metadata,
    Column(
        "outfit_id",
        ForeignKey("outfits.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "garment_id",
        ForeignKey("garments.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Outfit(Base):
    __tablename__ = "outfits"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False)

    # Examples: spring, summer, autumn, winter, all_season
    season: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Examples: casual, work, formal, sport, travel, party
    occasion: Mapped[str | None] = mapped_column(String(50), nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="outfits")

    garments = relationship(
        "Garment",
        secondary=outfit_garments,
        back_populates="outfits",
    )

