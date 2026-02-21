import asyncio
import json
import logging

from fastapi import APIRouter
from starlette.responses import StreamingResponse

from app.services.task_store import TaskPhase, get_task, remove_task

logger = logging.getLogger(__name__)

router = APIRouter()

HEARTBEAT_INTERVAL = 30  # seconds
STREAM_TIMEOUT = 300  # 5 minutes
CLEANUP_DELAY = 60  # seconds after stream ends


@router.get("/progress/{task_id}")
async def stream_progress(task_id: str):
    task = get_task(task_id)
    if task is None:
        async def error_stream():
            data = json.dumps({"phase": "failed", "progress": 0, "message": "Task not found", "error": "Task not found"})
            yield f"event: error\ndata: {data}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    async def event_stream():
        elapsed = 0.0
        try:
            while elapsed < STREAM_TIMEOUT:
                current = get_task(task_id)
                if current is None:
                    data = json.dumps({"phase": "failed", "progress": 0, "message": "Task removed", "error": "Task removed"})
                    yield f"event: error\ndata: {data}\n\n"
                    return

                payload = {
                    "phase": current.phase.value,
                    "progress": current.progress,
                    "message": current.message,
                }
                if current.error:
                    payload["error"] = current.error

                yield f"data: {json.dumps(payload)}\n\n"

                if current.phase in (TaskPhase.COMPLETED, TaskPhase.FAILED):
                    return

                # Wait for next update or heartbeat timeout
                try:
                    await asyncio.wait_for(current.event.wait(), timeout=HEARTBEAT_INTERVAL)
                except asyncio.TimeoutError:
                    # Send heartbeat comment to keep connection alive
                    yield ": heartbeat\n\n"
                    elapsed += HEARTBEAT_INTERVAL

            # Stream timeout
            data = json.dumps({"phase": "failed", "progress": 0, "message": "Stream timeout", "error": "Stream timeout"})
            yield f"event: timeout\ndata: {data}\n\n"
        finally:
            # Schedule cleanup after delay to allow reconnects
            async def cleanup():
                await asyncio.sleep(CLEANUP_DELAY)
                remove_task(task_id)
            asyncio.create_task(cleanup())

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
