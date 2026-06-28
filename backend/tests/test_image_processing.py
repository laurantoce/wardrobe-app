from types import SimpleNamespace

from app.config import settings
from app.services import image_processing
from app.services.image_processing import remove_background


def test_remove_background_returns_none_when_disabled(monkeypatch):
    monkeypatch.setattr(settings, "background_removal_enabled", False)

    assert remove_background(b"image") is None


def test_remove_background_uses_rembg_session_and_returns_png(monkeypatch):
    calls = {}

    def fake_new_session(model_name):
        calls["model_name"] = model_name
        return "session"

    def fake_remove(image_bytes, session, force_return_bytes):
        calls["remove"] = (image_bytes, session, force_return_bytes)
        return b"png"

    image_processing._background_session.cache_clear()
    monkeypatch.setattr(settings, "background_removal_enabled", True)
    monkeypatch.setattr(settings, "background_removal_model", "test-model")
    monkeypatch.setitem(
        __import__("sys").modules,
        "rembg",
        SimpleNamespace(new_session=fake_new_session, remove=fake_remove),
    )

    result = remove_background(b"image")

    assert result is not None
    assert result.image_bytes == b"png"
    assert result.mime_type == "image/png"
    assert calls["model_name"] == "test-model"
    assert calls["remove"] == (b"image", "session", True)