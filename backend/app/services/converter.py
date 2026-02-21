import asyncio
from collections.abc import Callable
from typing import Union

from app.models import FileFormat
from app.services.converters.document import (
    convert_docx_to_txt,
    convert_txt_to_docx,
    convert_txt_to_pdf,
)
from app.services.converters.image import convert_image
from app.services.converters.libreoffice import convert_with_libreoffice
from app.services.converters.pdf import convert_pdf_to_docx, convert_pdf_to_image
from app.services.converters.svg import convert_svg

ConverterFn = Union[
    Callable[[bytes, FileFormat, FileFormat], bytes],
    Callable[[bytes, FileFormat, FileFormat], "asyncio.coroutines"],
]

# Maps (source_format, target_format) to converter function
CONVERSION_MATRIX: dict[tuple[FileFormat, FileFormat], ConverterFn] = {
    # Image conversions
    (FileFormat.JPG, FileFormat.PNG): convert_image,
    (FileFormat.JPG, FileFormat.GIF): convert_image,
    (FileFormat.PNG, FileFormat.JPG): convert_image,
    (FileFormat.PNG, FileFormat.GIF): convert_image,
    (FileFormat.GIF, FileFormat.JPG): convert_image,
    (FileFormat.GIF, FileFormat.PNG): convert_image,
    # SVG conversions
    (FileFormat.SVG, FileFormat.PNG): convert_svg,
    (FileFormat.SVG, FileFormat.JPG): convert_svg,
    (FileFormat.SVG, FileFormat.GIF): convert_svg,
    (FileFormat.SVG, FileFormat.PDF): convert_svg,
    # PDF conversions
    (FileFormat.PDF, FileFormat.JPG): convert_pdf_to_image,
    (FileFormat.PDF, FileFormat.PNG): convert_pdf_to_image,
    (FileFormat.PDF, FileFormat.GIF): convert_pdf_to_image,
    (FileFormat.PDF, FileFormat.DOCX): convert_pdf_to_docx,
    # Document conversions
    (FileFormat.DOCX, FileFormat.TXT): convert_docx_to_txt,
    (FileFormat.DOCX, FileFormat.PDF): convert_with_libreoffice,
    (FileFormat.PPTX, FileFormat.PDF): convert_with_libreoffice,
    (FileFormat.TXT, FileFormat.DOCX): convert_txt_to_docx,
    (FileFormat.TXT, FileFormat.PDF): convert_txt_to_pdf,
}


def get_supported_targets(source: FileFormat) -> list[FileFormat]:
    """Return list of formats this source can be converted to."""
    return [target for (src, target) in CONVERSION_MATRIX if src == source]


async def convert_file(
    input_bytes: bytes,
    source: FileFormat,
    target: FileFormat,
    selected_pages: list[int] | None = None,
    progress_cb: Callable[[int, str], None] | None = None,
) -> bytes:
    """Run the appropriate converter. Raises ValueError if unsupported."""
    converter = CONVERSION_MATRIX.get((source, target))
    if converter is None:
        raise ValueError(
            f"Conversion from {source.value} to {target.value} is not supported"
        )

    kwargs: dict = {}
    if progress_cb is not None:
        kwargs["progress_cb"] = progress_cb
    if converter is convert_pdf_to_image and selected_pages is not None:
        kwargs["selected_pages"] = selected_pages

    result = converter(input_bytes, source, target, **kwargs)

    # Handle async converters (like libreoffice)
    if asyncio.iscoroutine(result):
        result = await result

    return result
