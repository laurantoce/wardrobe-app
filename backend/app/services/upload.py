"""S3-compatible object storage upload utility."""

import uuid


def upload_to_object_storage(image_bytes: bytes, mime_type: str) -> str | None:
    from app.config import settings

    if not settings.object_storage_endpoint or not settings.object_storage_public_url:
        return None

    try:
        import boto3
        from botocore.client import Config

        s3 = boto3.client(
            "s3",
            endpoint_url=settings.object_storage_endpoint,
            aws_access_key_id=settings.object_storage_access_key,
            aws_secret_access_key=settings.object_storage_secret_key,
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": "path"},
            ),
            region_name=settings.object_storage_region,
        )
        bucket = settings.object_storage_bucket

        try:
            s3.create_bucket(Bucket=bucket)
        except Exception:
            pass

        ext = mime_type.split("/")[-1].replace("jpeg", "jpg")
        key = f"{uuid.uuid4()}.{ext}"
        s3.put_object(Bucket=bucket, Key=key, Body=image_bytes, ContentType=mime_type)

        return f"{settings.object_storage_public_url.rstrip('/')}/{key}"
    except Exception:
        return None
