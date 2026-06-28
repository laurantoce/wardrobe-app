from datetime import datetime, timezone
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.dependencies import get_current_user, get_garment_service
from app.exceptions import NotFoundError
from app.main import app


class FakeGarmentService:
    def create(self, user_id, payload):
        return SimpleNamespace(
            id=123,
            created_at=datetime.now(timezone.utc),
            **payload.model_dump(),
        )

    def get(self, user_id, garment_id):
        raise NotFoundError("Garment not found")


def test_health_endpoint():
    client = TestClient(app)

    assert client.get("/health").json() == {"status": "ok"}


def test_garment_create_route_uses_dependency_overrides(api_user):
    app.dependency_overrides[get_current_user] = lambda: api_user
    app.dependency_overrides[get_garment_service] = lambda: FakeGarmentService()
    client = TestClient(app)

    try:
        response = client.post(
            "/garments",
            json={
                "name": "Black Jeans",
                "category": "bottom",
                "color_hex": "#111111",
                "color_name": "Black",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["id"] == 123
    assert response.json()["name"] == "Black Jeans"


def test_domain_errors_are_mapped_to_http_responses(api_user):
    app.dependency_overrides[get_current_user] = lambda: api_user
    app.dependency_overrides[get_garment_service] = lambda: FakeGarmentService()
    client = TestClient(app)

    try:
        response = client.get("/garments/404")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
    assert response.json() == {"detail": "Garment not found"}
