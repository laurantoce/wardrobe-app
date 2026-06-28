import pytest

from app.exceptions import NotFoundError, ValidationError
from app.models import User
from app.repositories import GarmentRepository, OutfitRepository
from app.schemas import OutfitCreate, OutfitUpdate
from app.services import OutfitService


def _service(db_session) -> OutfitService:
    return OutfitService(OutfitRepository(db_session), GarmentRepository(db_session))


def test_outfit_service_create_and_update_garment_set(db_session, user, make_garment):
    shirt = make_garment(name="Shirt")
    trousers = make_garment(name="Trousers", category="bottom")
    shoes = make_garment(name="Shoes", category="shoes")
    service = _service(db_session)

    outfit = service.create(
        user.id,
        OutfitCreate(name="Office", season="spring", garment_ids=[shirt.id, trousers.id]),
    )

    assert outfit.name == "Office"
    assert {g.id for g in outfit.garments} == {shirt.id, trousers.id}

    updated = service.update(
        user.id,
        outfit.id,
        OutfitUpdate(name="Office refined", garment_ids=[trousers.id, shoes.id]),
    )

    assert updated.name == "Office refined"
    assert {g.id for g in updated.garments} == {trousers.id, shoes.id}


def test_outfit_service_rejects_unknown_or_foreign_garments(db_session, user, make_garment):
    owned = make_garment()
    other_user = User(email="other@example.com", password_hash="")
    db_session.add(other_user)
    db_session.flush()
    foreign = make_garment(user_id=other_user.id, name="Foreign")
    service = _service(db_session)

    with pytest.raises(ValidationError, match=str([foreign.id, 9999])):
        service.create(
            user.id,
            OutfitCreate(name="Invalid", garment_ids=[owned.id, foreign.id, 9999]),
        )


def test_outfit_service_scopes_reads_to_user(db_session, user, make_outfit):
    other_user = User(email="outfit-other@example.com", password_hash="")
    db_session.add(other_user)
    db_session.flush()
    own = make_outfit(name="Mine")
    other = make_outfit(user_id=other_user.id, name="Not mine")
    service = _service(db_session)

    assert service.get(user.id, own.id).name == "Mine"

    with pytest.raises(NotFoundError):
        service.get(user.id, other.id)
