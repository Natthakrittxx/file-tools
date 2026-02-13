import io

from PIL import Image

from app.models import FileFormat


def convert_image(
    input_bytes: bytes, source: FileFormat, target: FileFormat
) -> bytes:
    """Convert between JPG, PNG, and GIF using Pillow."""
    img = Image.open(io.BytesIO(input_bytes))

    # Handle RGBA → RGB for JPG (no alpha channel)
    if target == FileFormat.JPG and img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    # Handle palette mode for PNG
    if target == FileFormat.PNG and img.mode == "P":
        img = img.convert("RGBA")

    # GIF: convert to palette mode
    if target == FileFormat.GIF and img.mode not in ("P", "L"):
        img = img.convert("RGB")

    format_map = {
        FileFormat.JPG: "JPEG",
        FileFormat.PNG: "PNG",
        FileFormat.GIF: "GIF",
    }

    output = io.BytesIO()
    img.save(output, format=format_map[target])
    return output.getvalue()
