import io
import os
import tempfile

from pdf2image import convert_from_bytes
from PIL import Image

from app.config import settings
from app.models import FileFormat


def convert_pdf_to_image(
    input_bytes: bytes, source: FileFormat, target: FileFormat
) -> bytes:
    """Convert first page of PDF to JPG, PNG, or GIF."""
    images = convert_from_bytes(input_bytes, first_page=1, last_page=1, dpi=200)
    if not images:
        raise ValueError("Could not extract pages from PDF")

    img = images[0]

    format_map = {
        FileFormat.JPG: ("JPEG", "RGB"),
        FileFormat.PNG: ("PNG", None),
        FileFormat.GIF: ("GIF", "RGB"),
    }

    pil_format, mode = format_map[target]
    if mode and img.mode != mode:
        img = img.convert(mode)

    output = io.BytesIO()
    img.save(output, format=pil_format)
    return output.getvalue()


def convert_pdf_to_docx(
    input_bytes: bytes, source: FileFormat, target: FileFormat
) -> bytes:
    """Convert PDF to DOCX using pdf2docx."""
    from pdf2docx import Converter

    with tempfile.TemporaryDirectory(dir=settings.temp_dir) as tmp:
        pdf_path = os.path.join(tmp, "input.pdf")
        docx_path = os.path.join(tmp, "output.docx")

        with open(pdf_path, "wb") as f:
            f.write(input_bytes)

        cv = Converter(pdf_path)
        cv.convert(docx_path)
        cv.close()

        with open(docx_path, "rb") as f:
            return f.read()
