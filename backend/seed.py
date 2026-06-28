"""Seed script — creates demo garments and outfits for the demo user.

Run inside the backend container:
    docker compose exec backend python seed.py

To start completely fresh first:
    docker compose down -v && docker compose up -d
    docker compose exec backend python seed.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Garment, Outfit
from app.repositories.user import UserRepository

DEMO_EMAIL = "demo@wardrobe.local"

GARMENTS = [
    dict(name="White Linen Shirt", category="top", color_hex="#f5f5f0", color_name="White", brand="Uniqlo", sub_type="shirt", occasion="casual"),
    dict(name="Navy Slim Chinos", category="bottom", color_hex="#1e2d4a", color_name="Navy", brand="Zara", sub_type="chinos", occasion="casual"),
    dict(name="White Leather Sneakers", category="shoes", color_hex="#f5f5f5", color_name="White", brand="Common Projects", sub_type="sneakers", occasion="casual"),
    dict(name="Camel Wool Blazer", category="outerwear", color_hex="#c19a6b", color_name="Camel", brand="COS", sub_type="blazer", occasion="work"),
    dict(name="Black Straight Jeans", category="bottom", color_hex="#1c1917", color_name="Black", brand="Arket", sub_type="jeans", occasion="casual"),
    dict(name="Cream Ribbed Turtleneck", category="top", color_hex="#f5f0e8", color_name="Cream", brand="& Other Stories", sub_type="turtleneck", occasion="casual"),
    dict(name="Burgundy Ankle Boots", category="shoes", color_hex="#6d1f2e", color_name="Burgundy", brand="Sam Edelman", sub_type="ankle boots", occasion="casual"),
    dict(name="Olive Field Jacket", category="outerwear", color_hex="#6b6f3c", color_name="Olive", brand="Barbour", sub_type="field jacket", occasion="casual"),
    dict(name="Grey Wool Trousers", category="bottom", color_hex="#9ca3af", color_name="Grey", brand="Massimo Dutti", sub_type="trousers", occasion="work"),
    dict(name="Silk Slip Dress", category="dress", color_hex="#d4a8a0", color_name="Pink", brand="Reformation", sub_type="slip dress", occasion="formal"),
]

OUTFITS = [
    dict(
        name="Clean Casual",
        season="spring",
        occasion="casual",
        notes="Classic clean look — great for coffee or a walk.",
        garment_indices=[0, 1, 2],
    ),
    dict(
        name="Smart Office",
        season="autumn",
        occasion="work",
        notes="Polished but comfortable for a long work day.",
        garment_indices=[3, 5, 8],
    ),
    dict(
        name="Weekend Stroll",
        season="autumn",
        occasion="casual",
        notes="Effortless weekend look with an edge.",
        garment_indices=[7, 5, 4, 6],
    ),
    dict(
        name="Monochrome Minimal",
        season="winter",
        occasion="casual",
        notes="Tonal dressing — all neutrals, all day.",
        garment_indices=[5, 4, 2],
    ),
    dict(
        name="Evening Out",
        season="all_season",
        occasion="formal",
        notes="Simple and elegant for dinner or an event.",
        garment_indices=[9, 6],
    ),
]


def seed() -> None:
    engine = create_engine(settings.database_url)

    with Session(engine) as db:
        user_repo = UserRepository(db)
        user = user_repo.get_or_create_demo(DEMO_EMAIL)
        print(f"User: {user.email} (id={user.id})")

        # ── garments — create any not yet in the DB (matched by name) ───────
        existing_names = {
            g.name
            for g in db.scalars(select(Garment).where(Garment.user_id == user.id))
        }
        garment_objects: list[Garment] = []
        created_count = 0
        for g in GARMENTS:
            if g["name"] not in existing_names:
                obj = Garment(user_id=user.id, **g)
                db.add(obj)
                garment_objects.append(obj)
                created_count += 1
            else:
                obj = db.scalar(
                    select(Garment).where(
                        Garment.user_id == user.id, Garment.name == g["name"]
                    )
                )
                garment_objects.append(obj)

        if created_count:
            db.commit()
            for obj in garment_objects:
                db.refresh(obj)
            print(f"Created {created_count} garments.")
        else:
            print(f"All {len(GARMENTS)} seed garments already exist.")

        # ── outfits — create any not yet in the DB (matched by name) ────────
        existing_outfit_names = {
            o.name
            for o in db.scalars(select(Outfit).where(Outfit.user_id == user.id))
        }
        created_outfits = 0
        for o in OUTFITS:
            if o["name"] in existing_outfit_names:
                continue
            indices = o.pop("garment_indices")
            outfit = Outfit(user_id=user.id, **o)
            outfit.garments = [
                garment_objects[i] for i in indices if i < len(garment_objects)
            ]
            db.add(outfit)
            created_outfits += 1

        if created_outfits:
            db.commit()
            print(f"Created {created_outfits} outfits.")
        else:
            print("All seed outfits already exist.")

    print("Done.")


if __name__ == "__main__":
    seed()
