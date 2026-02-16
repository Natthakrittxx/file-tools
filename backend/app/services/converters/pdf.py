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
    input_bytes: bytes,
    source: FileFormat,
    target: FileFormat,
    selected_pages: list[int] | None = None,
) -> bytes:
    """Convert PDF pages to images. Returns raw image bytes for a single page, or a ZIP archive for multiple pages."""
    images = convert_from_bytes(input_bytes, dpi=200)
    if not images:
        raise ValueError("Could not extract pages from PDF")
    if len(images) > MAX_PDF_PAGES:
        raise ValueError(f"PDF has {len(images)} pages, maximum is {MAX_PDF_PAGES}")

    if selected_pages is not None:
        for idx in selected_pages:
            if idx < 0 or idx >= len(images):
                raise ValueError(
                    f"Invalid page index {idx}. PDF has {len(images)} pages (valid: 0-{len(images) - 1})"
                )
        images = [images[i] for i in selected_pages]

    format_map = {
        FileFormat.JPG: ("JPEG", "RGB", "jpg"),
        FileFormat.PNG: ("PNG", None, "png"),
        FileFormat.GIF: ("GIF", "RGB", "gif"),
    }

    pil_format, mode, ext = format_map[target]

    if len(images) == 1:
        img = images[0]
        if mode and img.mode != mode:
            img = img.convert(mode)
        img_buffer = io.BytesIO()
        img.save(img_buffer, format=pil_format)
        return img_buffer.getvalue()

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
