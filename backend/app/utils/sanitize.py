import os
import re
import unicodedata


def sanitize_filename(filename: str, max_length: int = 200) -> str:
    """Sanitize a filename to prevent path traversal and other issues."""
    # Strip path components
    filename = os.path.basename(filename)

    # Normalize unicode
    filename = unicodedata.normalize("NFKD", filename)

    # Replace unsafe characters
    filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", filename)

    # Remove leading/trailing dots and spaces
    filename = filename.strip(". ")

    # Truncate to max length while preserving extension
    if len(filename) > max_length:
        name, ext = os.path.splitext(filename)
        filename = name[: max_length - len(ext)] + ext

    # Fallback if empty
    if not filename:
        filename = "unnamed_file"

    return filename
