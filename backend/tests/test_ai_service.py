from decimal import Decimal
from types import SimpleNamespace

import pytest

from app.exceptions import ExternalServiceError, ValidationError
from app.schemas.ai import SuggestionRequest
from app.services.image_processing import ProcessedImage
from app.services.ai import AIService


class FakeGarments:
    def __init__(self, garments):
        self._garments = garments

    def list_for_user(self, user_id):
        return self._garments


class FakeLLM:
    def __init__(self, generate_response="{}", image_response="{}"):
        self.generate_response = generate_response
        self.image_response = image_response

    def generate(self, prompt):
        self.prompt = prompt
        return self.generate_response

    def analyze_image(self, image_bytes, mime_type, prompt):
        self.image_args = (image_bytes, mime_type, prompt)
        return self.image_response


def test_ai_service_suggests_only_existing_garments():
    garments = [
        SimpleNamespace(id=1, name="Shirt", category="top", color_name="White", brand=None, occasion=None, material=None, sub_type=None),
        SimpleNamespace(id=2, name="Trousers", category="bottom", color_name="Navy", brand=None, occasion="work", material=None, sub_type=None),
    ]
    llm = FakeLLM(
        generate_response='{"suggestions":[{"title":"Office","garment_ids":[1,2,999],"reasoning":"Clean pairing."}]}'
    )
    service = AIService(FakeGarments(garments), llm)

    response = service.suggest_outfits(7, SuggestionRequest(occasion="work", max_outfits=1))

    assert len(response.suggestions) == 1
    assert response.suggestions[0].garment_ids == [1, 2]
    assert [g.name for g in response.suggestions[0].garments] == ["Shirt", "Trousers"]
    assert "occasion=work" in llm.prompt


def test_ai_service_requires_garments_before_suggesting():
    service = AIService(FakeGarments([]), FakeLLM())

    with pytest.raises(ValidationError, match="Add some garments"):
        service.suggest_outfits(7, SuggestionRequest())


def test_ai_service_rejects_invalid_llm_json():
    service = AIService(
        FakeGarments([
            SimpleNamespace(
                id=1,
                name="Shirt",
                category="top",
                color_name="White",
                brand=None,
                occasion=None,
                material=None,
                sub_type=None,
            )
        ]),
        FakeLLM("not json"),
    )

    with pytest.raises(ExternalServiceError, match="unexpected response format"):
        service.suggest_outfits(7, SuggestionRequest())


def test_ai_service_requires_llm_for_outfit_suggestions():
    service = AIService(FakeGarments([]), None)

    with pytest.raises(ExternalServiceError, match="AI not configured"):
        service.suggest_outfits(7, SuggestionRequest())


def test_ai_service_uploads_photo_without_llm(monkeypatch):
    monkeypatch.setattr("app.services.ai.upload_to_object_storage", lambda *_: "http://cdn/item.jpg")
    service = AIService(FakeGarments([]), None)

    analysis = service.analyze_garment_photo(b"image", "image/jpeg", generate_cutout=False)

    assert analysis.image_url == "http://cdn/item.jpg"
    assert analysis.original_image_url == "http://cdn/item.jpg"
    assert analysis.name is None

def test_ai_service_analyzes_photo_and_includes_uploaded_url(monkeypatch):
    llm = FakeLLM(
        image_response=(
            '{"name":"Linen Blazer","category":"outerwear","sub_type":"blazer",'
            '"brand":"Acme","color_name":"Cream","occasion":"work",'
            '"material":[{"material":"linen","pct":80}],"purchase_price":129.5,'
            '"notes":"Double breasted"}'
        )
    )
    monkeypatch.setattr("app.services.ai.upload_to_object_storage", lambda *_: "http://cdn/item.jpg")
    service = AIService(FakeGarments([]), llm)

    analysis = service.analyze_garment_photo(b"image", "image/jpeg", generate_cutout=False)

    assert analysis.image_url == "http://cdn/item.jpg"
    assert analysis.name == "Linen Blazer"
    assert analysis.purchase_price == Decimal("129.5")
    assert analysis.material[0].material == "linen"
    assert llm.image_args[0] == b"image"


def test_ai_service_generates_optional_cutout(monkeypatch):
    uploads = []
    llm = FakeLLM(image_response='{"name":"Tee","category":"top"}')

    def fake_upload(image_bytes, mime_type):
        uploads.append((image_bytes, mime_type))
        return f"http://cdn/{len(uploads)}.png"

    monkeypatch.setattr("app.services.ai.upload_to_object_storage", fake_upload)
    monkeypatch.setattr(
        "app.services.ai.remove_background",
        lambda image_bytes: ProcessedImage(b"cutout", "image/png"),
    )
    service = AIService(FakeGarments([]), llm)

    analysis = service.analyze_garment_photo(b"image", "image/jpeg")

    assert analysis.image_url == "http://cdn/1.png"
    assert analysis.original_image_url == "http://cdn/1.png"
    assert analysis.cutout_image_url == "http://cdn/2.png"
    assert uploads == [(b"image", "image/jpeg"), (b"cutout", "image/png")]