from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile

from app.config import settings
from app.dependencies import get_supabase_client
from app.models import (
    COMPRESSIBLE_FORMATS,
    CompressionResponse,
    CompressionResult,
    CompressionStatus,
)
from app.services.compressor import compress_file
from app.services.storage import upload_file
from app.utils.mime import validate_file_type
from app.utils.sanitize import sanitize_filename

router = APIRouter()

CONTENT_TYPE_MAP = {
    "jpg": "image/jpeg",
    "png": "image/png",
    "pdf": "application/pdf",
}


@router.get("/compressions", response_model=list[CompressionResult])
async def list_compressions(
    limit: int = 20,
    client=Depends(get_supabase_client),
):
    result = (
        client.table("compression_logs")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


@router.post("/compress", response_model=CompressionResponse)
async def compress(
    file: UploadFile,
    target_size_bytes: int = Form(...),
    client=Depends(get_supabase_client),
):
    file_bytes = await file.read()

    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_upload_bytes // (1024 * 1024)}MB",
        )

    filename = sanitize_filename(file.filename or "unnamed")

    try:
        source_format = validate_file_type(filename, file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if source_format not in COMPRESSIBLE_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Compression is not supported for {source_format.value} files. "
            f"Supported formats: {[f.value for f in COMPRESSIBLE_FORMATS]}",
        )

    if target_size_bytes >= len(file_bytes):
        raise HTTPException(
            status_code=400,
            detail="Target size must be smaller than the original file size",
        )

    log_entry = {
        "original_filename": filename,
        "source_format": source_format.value,
        "original_size_bytes": len(file_bytes),
        "target_size_bytes": target_size_bytes,
        "status": CompressionStatus.PROCESSING.value,
    }
    result = client.table("compression_logs").insert(log_entry).execute()
    compression_id = result.data[0]["id"]

    try:
        original_path = f"originals/{compression_id}/{filename}"
        upload_file(client, original_path, file_bytes, file.content_type or "application/octet-stream")

        compressed_bytes = compress_file(file_bytes, source_format, target_size_bytes)

        compressed_path = f"compressed/{compression_id}/{filename}"
        content_type = CONTENT_TYPE_MAP.get(source_format.value, "application/octet-stream")
        upload_file(client, compressed_path, compressed_bytes, content_type)

        client.table("compression_logs").update(
            {
                "status": CompressionStatus.COMPLETED.value,
                "compressed_size_bytes": len(compressed_bytes),
                "original_storage_path": original_path,
                "compressed_storage_path": compressed_path,
            }
        ).eq("id", compression_id).execute()

        return CompressionResponse(
            id=compression_id,
            status=CompressionStatus.COMPLETED,
            original_filename=filename,
            source_format=source_format.value,
            original_size_bytes=len(file_bytes),
            target_size_bytes=target_size_bytes,
            compressed_size_bytes=len(compressed_bytes),
        )

    except Exception as e:
        client.table("compression_logs").update(
            {
                "status": CompressionStatus.FAILED.value,
                "error_message": str(e),
            }
        ).eq("id", compression_id).execute()

        return CompressionResponse(
            id=compression_id,
            status=CompressionStatus.FAILED,
            original_filename=filename,
            source_format=source_format.value,
            original_size_bytes=len(file_bytes),
            target_size_bytes=target_size_bytes,
            error_message=str(e),
        )
