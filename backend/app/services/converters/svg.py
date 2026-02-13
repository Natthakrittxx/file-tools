import io

import cairosvg
from PIL import Image

from app.models import FileFormat


def convert_svg(
    input_bytes: bytes, source: FileFormat, target: FileFormat
) -> bytes:
    """Convert SVG to PNG, JPG, GIF, or PDF."""
    if target == FileFormat.PDF:
        return cairosvg.svg2pdf(bytestring=input_bytes)

    # First convert to PNG via cairosvg
    png_bytes = cairosvg.svg2png(bytestring=input_bytes)

    if target == FileFormat.PNG:
        return png_bytes

    # For JPG/GIF, use Pillow on the PNG
    img = Image.open(io.BytesIO(png_bytes))

    if target == FileFormat.JPG:
        img = img.convert("RGB")
        output = io.BytesIO()
        img.save(output, format="JPEG")
        return output.getvalue()

    if target == FileFormat.GIF:
        img = img.convert("RGB")
        output = io.BytesIO()
        img.save(output, format="GIF")
        return output.getvalue()

    raise ValueError(f"Unsupported SVG target: {target}")
