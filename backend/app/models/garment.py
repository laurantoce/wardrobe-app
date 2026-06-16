from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, JSON, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Garment(Base):
    __tablename__ = "garments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False)

    # Examples: top, bottom, shoes, accessory, outerwear, dress, underwear, other
    category: Mapped[str] = mapped_column(String(50), nullable=False)

    # Store main color as hex, for example: #000000, #FFFFFF, #A43F2D
    color_hex: Mapped[str | None] = mapped_column(String(7), nullable=True)

    # Human/family color name from the curated palette (e.g. "Black", "Navy",
    # "Camel"). Drives meaningful color analytics; hex stays for the exact swatch.
    color_name: Mapped[str | None] = mapped_column(String(40), nullable=True)

    brand: Mapped[str | None] = mapped_column(String(100), nullable=True)

    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    purchase_price: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )

    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Useful if image/product was found online
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Examples: casual, work, formal, sport, beach, travel, lounge
    occasion: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # JSON array — e.g. ["cotton", "linen"] (primary material first)
    material: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # Subtype within the category — e.g. "t-shirt", "sneakers", "blazer"
    sub_type: Mapped[str | None] = mapped_column(String(80), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="garments")

    outfits = relationship(
        "Outfit",
        secondary="outfit_garments",
        back_populates="garments",
    )

