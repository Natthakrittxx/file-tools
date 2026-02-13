import magic

from app.models import EXTENSION_TO_FORMAT, MIME_TO_FORMAT, FileFormat


def detect_mime_type(file_bytes: bytes) -> str:
    return magic.from_buffer(file_bytes, mime=True)


def validate_file_type(filename: str, file_bytes: bytes) -> FileFormat:
    """Validate that the file's MIME type matches its extension.

    Returns the detected FileFormat or raises ValueError.
    """
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    ext_format = EXTENSION_TO_FORMAT.get(ext)
    if ext_format is None:
        raise ValueError(f"Unsupported file extension: {ext}")

    mime = detect_mime_type(file_bytes)
    mime_format = MIME_TO_FORMAT.get(mime)

    # Allow text/plain MIME for some document types (DOCX/PPTX detected as zip)
    # and allow application/octet-stream as a fallback
    if mime_format is None and mime in (
        "application/octet-stream",
        "application/zip",
        "application/x-zip-compressed",
    ):
        return ext_format

    if mime_format is None:
        raise ValueError(f"Unrecognized MIME type: {mime}")

    if mime_format != ext_format:
        # Allow jpeg MIME with jpg extension
        if not (mime_format == FileFormat.JPG and ext_format == FileFormat.JPG):
            raise ValueError(
                f"MIME type mismatch: file appears to be {mime_format.value} "
                f"but has extension {ext}"
            )

    return ext_format
