from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_supabase_client
from app.services.storage import create_download_url

router = APIRouter()


@router.get("/download/{conversion_id}")
async def download(
    conversion_id: str,
    client=Depends(get_supabase_client),
):
    result = (
        client.table("conversion_logs")
        .select("converted_storage_path, status")
        .eq("id", conversion_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Conversion not found")

    record = result.data[0]
    if record["status"] != "completed":
        raise HTTPException(status_code=400, detail="Conversion is not completed")

    if not record["converted_storage_path"]:
        raise HTTPException(status_code=404, detail="Converted file not found")

    url = create_download_url(client, record["converted_storage_path"])
    return {"download_url": url}
