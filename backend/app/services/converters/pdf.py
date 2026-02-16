import io
import os
import tempfile
import zipfile

from pdf2image import convert_from_bytes
from PIL import Image

from app.config import settings
from app.models import FileFormat

MAX_PDF_PAGES = 50


def convert_pdf_to_image(
    input_bytes: bytes, source: FileFormat, target: FileFormat
) -> bytes:
    """Convert all pages of PDF to images and return as a ZIP archive."""
    images = convert_from_bytes(input_bytes, dpi=200)
    if not images:
        raise ValueError("Could not extract pages from PDF")
    if len(images) > MAX_PDF_PAGES:
        raise ValueError(f"PDF has {len(images)} pages, maximum is {MAX_PDF_PAGES}")

    format_map = {
        FileFormat.JPG: ("JPEG", "RGB", "jpg"),
        FileFormat.PNG: ("PNG", None, "png"),
        FileFormat.GIF: ("GIF", "RGB", "gif"),
    }

    pil_format, mode, ext = format_map[target]

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for i, img in enumerate(images, start=1):
            if mode and img.mode != mode:
                img = img.convert(mode)
            img_buffer = io.BytesIO()
            img.save(img_buffer, format=pil_format)
            zf.writestr(f"page_{i}.{ext}", img_buffer.getvalue())

    return zip_buffer.getvalue()


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
