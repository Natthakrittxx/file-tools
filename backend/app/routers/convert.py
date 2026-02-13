from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.config import settings
from app.dependencies import get_supabase_client
from app.models import (
    ConversionResponse,
    ConversionResult,
    ConversionStatus,
    FileFormat,
    FORMAT_TO_EXTENSION,
)
from app.services.converter import convert_file, get_supported_targets
from app.services.storage import upload_file
from app.utils.mime import validate_file_type
from app.utils.sanitize import sanitize_filename

router = APIRouter()


@router.post("/convert", response_model=ConversionResponse)
async def convert(
    file: UploadFile,
    target_format: FileFormat,
    client=Depends(get_supabase_client),
):
    # Read file
    file_bytes = await file.read()

    # Check size
    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_upload_bytes // (1024 * 1024)}MB",
        )

    # Sanitize filename
    filename = sanitize_filename(file.filename or "unnamed")

    # Validate MIME type
    try:
        source_format = validate_file_type(filename, file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Check conversion is supported
    supported = get_supported_targets(source_format)
    if target_format not in supported:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot convert {source_format.value} to {target_format.value}. "
            f"Supported targets: {[t.value for t in supported]}",
        )

    # Create conversion log entry
    log_entry = {
        "original_filename": filename,
        "source_format": source_format.value,
        "target_format": target_format.value,
        "status": ConversionStatus.PROCESSING.value,
        "file_size_bytes": len(file_bytes),
    }
    result = client.table("conversion_logs").insert(log_entry).execute()
    conversion_id = result.data[0]["id"]

    try:
        # Upload original
        original_path = f"originals/{conversion_id}/{filename}"
        upload_file(client, original_path, file_bytes, file.content_type or "application/octet-stream")

        # Convert
        converted_bytes = await convert_file(file_bytes, source_format, target_format)

        # Upload converted
        base_name = filename.rsplit(".", 1)[0] if "." in filename else filename
        converted_name = base_name + FORMAT_TO_EXTENSION[target_format]
        converted_path = f"converted/{conversion_id}/{converted_name}"

        content_type_map = {
            FileFormat.JPG: "image/jpeg",
            FileFormat.PNG: "image/png",
            FileFormat.GIF: "image/gif",
            FileFormat.SVG: "image/svg+xml",
            FileFormat.PDF: "application/pdf",
            FileFormat.DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            FileFormat.PPTX: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            FileFormat.TXT: "text/plain",
        }
        upload_file(client, converted_path, converted_bytes, content_type_map[target_format])

        # Update log
        client.table("conversion_logs").update(
            {
                "status": ConversionStatus.COMPLETED.value,
                "original_storage_path": original_path,
                "converted_storage_path": converted_path,
            }
        ).eq("id", conversion_id).execute()

        return ConversionResponse(
            id=conversion_id,
            status=ConversionStatus.COMPLETED,
            original_filename=filename,
            source_format=source_format.value,
            target_format=target_format.value,
        )

    except Exception as e:
        # Log failure
        client.table("conversion_logs").update(
            {
                "status": ConversionStatus.FAILED.value,
                "error_message": str(e),
            }
        ).eq("id", conversion_id).execute()

        return ConversionResponse(
            id=conversion_id,
            status=ConversionStatus.FAILED,
            original_filename=filename,
            source_format=source_format.value,
            target_format=target_format.value,
            error_message=str(e),
        )


@router.get("/conversions", response_model=list[ConversionResult])
async def list_conversions(
    limit: int = 20,
    client=Depends(get_supabase_client),
):
    result = (
        client.table("conversion_logs")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data
