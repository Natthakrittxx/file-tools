import io

from PIL import Image
from pdf2image import convert_from_bytes

from app.models import FileFormat

MIN_IMAGE_BYTES = 1024  # 1 KB
MIN_PDF_BYTES = 10240  # 10 KB


def compress_image_to_target(
    file_bytes: bytes, source_format: FileFormat, target_size_bytes: int
) -> bytes:
    """Compress a JPG or PNG to fit within target_size_bytes."""
    if target_size_bytes < MIN_IMAGE_BYTES:
        raise ValueError(f"Target size must be at least {MIN_IMAGE_BYTES // 1024} KB for images")

    img = Image.open(io.BytesIO(file_bytes))

    if source_format == FileFormat.JPG:
        return _compress_jpeg(img, target_size_bytes)
    elif source_format == FileFormat.PNG:
        return _compress_png(img, target_size_bytes)
    else:
        raise ValueError(f"Unsupported image format for compression: {source_format.value}")


def _compress_jpeg(img: Image.Image, target_size_bytes: int) -> bytes:
    """Iterative JPEG quality reduction, then progressive resizing."""
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    # Try quality reduction first (95 → 5)
    for quality in range(95, 4, -5):
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        if buf.tell() <= target_size_bytes:
            return buf.getvalue()

    # Quality alone wasn't enough — progressively resize
    scale = 0.9
    while scale > 0.1:
        w, h = img.size
        resized = img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
        buf = io.BytesIO()
        resized.save(buf, format="JPEG", quality=5, optimize=True)
        if buf.tell() <= target_size_bytes:
            return buf.getvalue()
        scale -= 0.1

    raise ValueError("Cannot compress image to the requested target size")


def _compress_png(img: Image.Image, target_size_bytes: int) -> bytes:
    """Color quantization (256 colors), then progressive resizing."""
    # Quantize to 256 colors
    quantized = img.quantize(colors=256).convert(img.mode)

    buf = io.BytesIO()
    quantized.save(buf, format="PNG", optimize=True)
    if buf.tell() <= target_size_bytes:
        return buf.getvalue()

    # Progressively resize
    scale = 0.9
    while scale > 0.1:
        w, h = quantized.size
        resized = quantized.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
        buf = io.BytesIO()
        resized.save(buf, format="PNG", optimize=True)
        if buf.tell() <= target_size_bytes:
            return buf.getvalue()
        scale -= 0.1

    raise ValueError("Cannot compress image to the requested target size")


def compress_pdf_to_target(file_bytes: bytes, target_size_bytes: int) -> bytes:
    """Rasterize PDF pages, compress each as JPEG, reassemble as PDF."""
    if target_size_bytes < MIN_PDF_BYTES:
        raise ValueError(f"Target size must be at least {MIN_PDF_BYTES // 1024} KB for PDFs")

    pages = convert_from_bytes(file_bytes)
    if not pages:
        raise ValueError("PDF has no pages")

    per_page_budget = target_size_bytes // len(pages)

    compressed_pages: list[Image.Image] = []
    for page in pages:
        page_rgb = page.convert("RGB")
        compressed_page = _compress_single_page(page_rgb, per_page_budget)
        compressed_pages.append(Image.open(io.BytesIO(compressed_page)))

    buf = io.BytesIO()
    if len(compressed_pages) == 1:
        compressed_pages[0].save(buf, format="PDF")
    else:
        compressed_pages[0].save(buf, format="PDF", save_all=True, append_images=compressed_pages[1:])

    result = buf.getvalue()
    if len(result) > target_size_bytes:
        # Try with lower DPI by resizing pages down
        scale = target_size_bytes / len(result) * 0.9
        if scale < 0.1:
            raise ValueError("Cannot compress PDF to the requested target size")
        resized_pages = []
        for page in compressed_pages:
            w, h = page.size
            resized = page.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
            resized_pages.append(resized)
        buf = io.BytesIO()
        if len(resized_pages) == 1:
            resized_pages[0].save(buf, format="PDF")
        else:
            resized_pages[0].save(buf, format="PDF", save_all=True, append_images=resized_pages[1:])
        result = buf.getvalue()

    return result


def _compress_single_page(img: Image.Image, target_bytes: int) -> bytes:
    """Compress a single page image as JPEG within budget."""
    for quality in range(85, 4, -10):
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        if buf.tell() <= target_bytes:
            return buf.getvalue()

    # Resize as fallback
    scale = 0.8
    while scale > 0.1:
        w, h = img.size
        resized = img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
        buf = io.BytesIO()
        resized.save(buf, format="JPEG", quality=5, optimize=True)
        if buf.tell() <= target_bytes:
            return buf.getvalue()
        scale -= 0.1

    # Return best effort
    buf = io.BytesIO()
    img.resize((max(1, img.size[0] // 10), max(1, img.size[1] // 10)), Image.LANCZOS).save(
        buf, format="JPEG", quality=5, optimize=True
    )
    return buf.getvalue()


def compress_file(
    file_bytes: bytes, source_format: FileFormat, target_size_bytes: int
) -> bytes:
    """Dispatch to the correct compressor based on format."""
    if source_format in (FileFormat.JPG, FileFormat.PNG):
        return compress_image_to_target(file_bytes, source_format, target_size_bytes)
    elif source_format == FileFormat.PDF:
        return compress_pdf_to_target(file_bytes, target_size_bytes)
    else:
        raise ValueError(f"Compression is not supported for {source_format.value} files")
