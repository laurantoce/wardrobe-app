from types import SimpleNamespace

from app.config import settings
from app.services.upload import upload_to_object_storage


class FakeS3:
    def __init__(self):
        self.created_bucket = None
        self.put_object_call = None

    def create_bucket(self, Bucket):
        self.created_bucket = Bucket

    def put_object(self, **kwargs):
        self.put_object_call = kwargs


def test_upload_returns_none_when_not_configured(monkeypatch):
    monkeypatch.setattr(settings, "object_storage_endpoint", "")

    assert upload_to_object_storage(b"image", "image/jpeg") is None


def test_upload_uses_s3_compatible_client(monkeypatch):
    fake_s3 = FakeS3()

    def fake_client(*args, **kwargs):
        fake_client.args = args
        fake_client.kwargs = kwargs
        return fake_s3

    monkeypatch.setattr(settings, "object_storage_endpoint", "http://storage:3900")
    monkeypatch.setattr(settings, "object_storage_public_url", "http://localhost:3902/")
    monkeypatch.setattr(settings, "object_storage_access_key", "access")
    monkeypatch.setattr(settings, "object_storage_secret_key", "secret")
    monkeypatch.setattr(settings, "object_storage_bucket", "localhost")
    monkeypatch.setattr(settings, "object_storage_region", "garage")
    monkeypatch.setitem(
        __import__("sys").modules,
        "boto3",
        SimpleNamespace(client=fake_client),
    )
    monkeypatch.setitem(
        __import__("sys").modules,
        "botocore.client",
        SimpleNamespace(Config=lambda **kwargs: kwargs),
    )

    url = upload_to_object_storage(b"image", "image/jpeg")

    assert url.startswith("http://localhost:3902/")
    assert url.endswith(".jpg")
    assert fake_s3.created_bucket == "localhost"
    assert fake_s3.put_object_call["Bucket"] == "localhost"
    assert fake_s3.put_object_call["Body"] == b"image"
    assert fake_s3.put_object_call["ContentType"] == "image/jpeg"
    assert fake_client.kwargs["endpoint_url"] == "http://storage:3900"
