import asyncio
import os
import tempfile
from collections.abc import Callable

from app.config import settings
from app.models import FileFormat


async def convert_with_libreoffice(
    input_bytes: bytes,
    source: FileFormat,
    target: FileFormat,
    progress_cb: Callable[[int, str], None] | None = None,
) -> bytes:
    """Convert DOCX/PPTX to PDF using LibreOffice headless."""
    ext_map = {FileFormat.DOCX: ".docx", FileFormat.PPTX: ".pptx"}
    input_ext = ext_map.get(source)
    if input_ext is None:
        raise ValueError(f"LibreOffice converter does not support {source}")

    if progress_cb:
        progress_cb(10, "Starting LibreOffice...")

    with tempfile.TemporaryDirectory(dir=settings.temp_dir) as tmp:
        input_path = os.path.join(tmp, f"input{input_ext}")
        with open(input_path, "wb") as f:
            f.write(input_bytes)

        process = await asyncio.create_subprocess_exec(
            "libreoffice",
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            tmp,
            input_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            raise RuntimeError(
                f"LibreOffice conversion failed: {stderr.decode()}"
            )

        output_path = os.path.join(tmp, "input.pdf")
        if not os.path.exists(output_path):
            raise RuntimeError("LibreOffice did not produce output file")

        if progress_cb:
            progress_cb(90, "Conversion complete")

        with open(output_path, "rb") as f:
            return f.read()
