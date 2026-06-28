from decimal import Decimal

import pytest

from app.exceptions import NotFoundError
from app.models import User
from app.repositories import GarmentRepository
from app.schemas import GarmentCreate, GarmentUpdate
from app.services import GarmentService


def test_garment_service_create_update_delete(db_session, user):
    service = GarmentService(GarmentRepository(db_session))

    created = service.create(
        user.id,
        GarmentCreate(
            name="Black Jeans",
            category="bottom",
            color_hex="#111111",
            color_name="Black",
            purchase_price=Decimal("79.90"),
        ),
    )

    assert created.id is not None
    assert created.user_id == user.id
    assert created.purchase_price == Decimal("79.90")

    updated = service.update(
        user.id,
        created.id,
        GarmentUpdate(name="Washed Black Jeans", purchase_price=Decimal("69.90")),
    )

    assert updated.name == "Washed Black Jeans"
    assert updated.category == "bottom"
    assert updated.purchase_price == Decimal("69.90")

    service.delete(user.id, created.id)

    with pytest.raises(NotFoundError):
        service.get(user.id, created.id)


def test_garment_service_scopes_reads_to_user(db_session, user, make_garment):
    other_user = User(email="garment-other@example.com", password_hash="")
    db_session.add(other_user)
    db_session.flush()
    other = make_garment(user_id=other_user.id, name="Other user coat", category="outerwear")
    own = make_garment(name="Own shirt")
    service = GarmentService(GarmentRepository(db_session))

    assert service.list(user.id) == [own]

    with pytest.raises(NotFoundError):
        service.get(user.id, other.id)
