"""In-memory progress store for conversion tasks, used to push SSE updates."""

import asyncio
from dataclasses import dataclass, field
from enum import Enum


class TaskPhase(str, Enum):
    UPLOADING_ORIGINAL = "uploading_original"
    CONVERTING = "converting"
    UPLOADING_RESULT = "uploading_result"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class TaskProgress:
    phase: TaskPhase = TaskPhase.UPLOADING_ORIGINAL
    progress: int = 0
    message: str = ""
    error: str | None = None
    event: asyncio.Event = field(default_factory=asyncio.Event)


_tasks: dict[str, TaskProgress] = {}


def create_task(task_id: str) -> TaskProgress:
    task = TaskProgress()
    _tasks[task_id] = task
    return task


def get_task(task_id: str) -> TaskProgress | None:
    return _tasks.get(task_id)


def update_task(
    task_id: str,
    *,
    phase: TaskPhase | None = None,
    progress: int | None = None,
    message: str | None = None,
    error: str | None = None,
) -> None:
    task = _tasks.get(task_id)
    if task is None:
        return
    if phase is not None:
        task.phase = phase
    if progress is not None:
        task.progress = progress
    if message is not None:
        task.message = message
    if error is not None:
        task.error = error
    # Wake any waiting SSE stream
    task.event.set()
    task.event.clear()


def remove_task(task_id: str) -> None:
    _tasks.pop(task_id, None)
