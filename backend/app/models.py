from enum import Enum

from pydantic import BaseModel


class FileFormat(str, Enum):
    JPG = "jpg"
    PNG = "png"
    GIF = "gif"
    SVG = "svg"
    PDF = "pdf"
    DOCX = "docx"
    PPTX = "pptx"
    TXT = "txt"


class ConversionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ConversionResponse(BaseModel):
    id: str
    status: ConversionStatus
    original_filename: str
    source_format: str
    target_format: str
    error_message: str | None = None


class ConversionResult(BaseModel):
    id: str
    original_filename: str
    source_format: str
    target_format: str
    status: str
    error_message: str | None = None
    original_storage_path: str | None = None
    converted_storage_path: str | None = None
    file_size_bytes: int | None = None
    created_at: str | None = None
    updated_at: str | None = None


EXTENSION_TO_FORMAT: dict[str, FileFormat] = {
    ".jpg": FileFormat.JPG,
    ".jpeg": FileFormat.JPG,
    ".png": FileFormat.PNG,
    ".gif": FileFormat.GIF,
    ".svg": FileFormat.SVG,
    ".pdf": FileFormat.PDF,
    ".docx": FileFormat.DOCX,
    ".pptx": FileFormat.PPTX,
    ".txt": FileFormat.TXT,
}

FORMAT_TO_EXTENSION: dict[FileFormat, str] = {
    FileFormat.JPG: ".jpg",
    FileFormat.PNG: ".png",
    FileFormat.GIF: ".gif",
    FileFormat.SVG: ".svg",
    FileFormat.PDF: ".pdf",
    FileFormat.DOCX: ".docx",
    FileFormat.PPTX: ".pptx",
    FileFormat.TXT: ".txt",
}

class CompressionStatus(str, Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CompressionResponse(BaseModel):
    id: str
    status: CompressionStatus
    original_filename: str
    source_format: str
    original_size_bytes: int
    target_size_bytes: int
    compressed_size_bytes: int | None = None
    error_message: str | None = None


COMPRESSIBLE_FORMATS: set[FileFormat] = {FileFormat.JPG, FileFormat.PNG, FileFormat.PDF}


MIME_TO_FORMAT: dict[str, FileFormat] = {
    "image/jpeg": FileFormat.JPG,
    "image/png": FileFormat.PNG,
    "image/gif": FileFormat.GIF,
    "image/svg+xml": FileFormat.SVG,
    "application/pdf": FileFormat.PDF,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileFormat.DOCX,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": FileFormat.PPTX,
    "text/plain": FileFormat.TXT,
}
