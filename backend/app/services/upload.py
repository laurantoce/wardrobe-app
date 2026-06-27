"""MinIO upload utility — shared between AIService and the photo endpoints."""
import json
import uuid


def upload_to_minio(image_bytes: bytes, mime_type: str) -> str | None:
    from app.config import settings
    if not settings.minio_endpoint:
        return None
    try:
        import boto3
        from botocore.client import Config

        s3 = boto3.client(
            "s3",
            endpoint_url=settings.minio_endpoint,
            aws_access_key_id=settings.minio_access_key,
            aws_secret_access_key=settings.minio_secret_key,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",
        )
        bucket = settings.minio_bucket

        # Idempotent: create bucket + public-read policy on first use
        try:
            s3.create_bucket(Bucket=bucket)
            s3.put_bucket_policy(Bucket=bucket, Policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{"Effect": "Allow", "Principal": {"AWS": ["*"]},
                               "Action": ["s3:GetObject"], "Resource": [f"arn:aws:s3:::{bucket}/*"]}],
            }))
        except Exception:
            pass  # bucket already exists

        ext = mime_type.split("/")[-1].replace("jpeg", "jpg")
        key = f"{uuid.uuid4()}.{ext}"
        s3.put_object(Bucket=bucket, Key=key, Body=image_bytes, ContentType=mime_type)
        return f"{settings.minio_public_url}/{bucket}/{key}"
    except Exception:
        return None
