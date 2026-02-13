from supabase import Client

from app.config import settings


def upload_file(
    client: Client, path: str, file_bytes: bytes, content_type: str
) -> str:
    """Upload file to Supabase storage. Returns the storage path."""
    client.storage.from_(settings.supabase_bucket).upload(
        path, file_bytes, {"content-type": content_type}
    )
    return path


def create_download_url(client: Client, path: str, expires_in: int = 3600) -> str:
    """Create a signed download URL (default 1hr expiry)."""
    result = client.storage.from_(settings.supabase_bucket).create_signed_url(
        path, expires_in
    )
    return result["signedURL"]


def delete_file(client: Client, path: str) -> None:
    """Delete a file from Supabase storage."""
    client.storage.from_(settings.supabase_bucket).remove([path])
