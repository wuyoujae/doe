from __future__ import annotations

import csv
import io
import json
import re
import unicodedata
from pathlib import Path

from otherone_file_parser.api.errors import ErrorCode, ParserError
from otherone_file_parser.config import Settings
from otherone_file_parser.core.models import DocumentInput
from otherone_file_parser.infrastructure.archive_guard import validate_ooxml_archive

EXTENSION_ALIASES = {"htm": "html"}
SUPPORTED_EXTENSIONS = frozenset(
    {"pdf", "docx", "pptx", "xlsx", "html", "htm", "md", "csv", "txt", "json"}
)
DOCLING_EXTENSIONS = frozenset({"pdf", "docx", "pptx", "xlsx", "html", "md", "csv"})
TEXT_ADAPTER_EXTENSIONS = frozenset({"txt", "json"})

CANONICAL_MIME_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "html": "text/html",
    "md": "text/markdown",
    "csv": "text/csv",
    "txt": "text/plain",
    "json": "application/json",
}

_ACCEPTED_MIME_TYPES = {
    "pdf": {"application/pdf"},
    "docx": {CANONICAL_MIME_TYPES["docx"], "application/msword", "application/zip"},
    "pptx": {
        CANONICAL_MIME_TYPES["pptx"],
        "application/vnd.ms-powerpoint",
        "application/zip",
    },
    "xlsx": {
        CANONICAL_MIME_TYPES["xlsx"],
        "application/vnd.ms-excel",
        "application/zip",
    },
    "html": {"text/html", "application/xhtml+xml", "text/plain"},
    "md": {"text/markdown", "text/x-markdown", "text/plain"},
    "csv": {"text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"},
    "txt": {"text/plain"},
    "json": {"application/json", "text/json", "text/plain"},
}

_GENERIC_MIME_TYPES = {"application/octet-stream", "binary/octet-stream"}
_HTML_MARKER = re.compile(r"<\s*(?:!doctype|html|head|body|p|div|h[1-6]|table)\b", re.IGNORECASE)


def safe_extension(original_name: str | None) -> str:
    if not original_name or len(original_name) > 255 or len(original_name.encode("utf-8")) > 1_024:
        raise ParserError(ErrorCode.INVALID_REQUEST)
    if any(unicodedata.category(character) == "Cc" for character in original_name):
        raise ParserError(ErrorCode.INVALID_REQUEST)
    if "/" in original_name or "\\" in original_name:
        raise ParserError(ErrorCode.INVALID_REQUEST)

    suffix = Path(original_name).suffix.lower().lstrip(".")
    if suffix not in SUPPORTED_EXTENSIONS:
        if suffix in {"doc", "ppt", "xls"}:
            raise ParserError(
                ErrorCode.UNSUPPORTED_TYPE,
                message="旧版 Office 格式暂不支持，请另存为 DOCX、PPTX 或 XLSX",
            )
        raise ParserError(ErrorCode.UNSUPPORTED_TYPE)
    return EXTENSION_ALIASES.get(suffix, suffix)


def normalize_declared_mime_type(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.split(";", 1)[0].strip().lower()
    return normalized or None


def _validate_declared_mime(extension: str, declared_mime_type: str | None) -> None:
    if declared_mime_type is None or declared_mime_type in _GENERIC_MIME_TYPES:
        return
    if declared_mime_type not in _ACCEPTED_MIME_TYPES[extension]:
        raise ParserError(ErrorCode.TYPE_MISMATCH)


def _read_strict_utf8(path: Path) -> str:
    try:
        text = path.read_text(encoding="utf-8-sig")
    except (UnicodeDecodeError, OSError) as exc:
        raise ParserError(ErrorCode.TYPE_MISMATCH) from exc
    if "\x00" in text:
        raise ParserError(ErrorCode.TYPE_MISMATCH)
    return text


def _validate_pdf(path: Path) -> None:
    try:
        with path.open("rb") as stream:
            if b"%PDF-" not in stream.read(1024):
                raise ParserError(ErrorCode.TYPE_MISMATCH)
            stream.seek(0, 2)
            length = stream.tell()
            stream.seek(max(0, length - 128 * 1024))
            trailer = stream.read()
    except ParserError:
        raise
    except OSError as exc:
        raise ParserError(ErrorCode.CORRUPT_DOCUMENT) from exc
    if b"/Encrypt" in trailer:
        raise ParserError(ErrorCode.PASSWORD_PROTECTED)


def _validate_text_structure(path: Path, extension: str) -> None:
    text = _read_strict_utf8(path)
    if not text.strip():
        raise ParserError(ErrorCode.EMPTY_CONTENT)

    try:
        if extension == "json":
            json.loads(text)
        elif extension == "csv":
            rows = csv.reader(io.StringIO(text))
            next(rows)
        elif extension == "html" and not _HTML_MARKER.search(text[:64_000]):
            raise ParserError(ErrorCode.TYPE_MISMATCH)
    except ParserError:
        raise
    except (csv.Error, json.JSONDecodeError, StopIteration) as exc:
        raise ParserError(ErrorCode.CORRUPT_DOCUMENT) from exc


def validate_document(
    *,
    path: Path,
    original_name: str,
    declared_mime_type: str | None,
    size_bytes: int,
    sha256: str,
    settings: Settings,
) -> DocumentInput:
    extension = safe_extension(original_name)
    if size_bytes <= 0:
        raise ParserError(ErrorCode.EMPTY_FILE)
    if size_bytes > settings.max_file_bytes:
        raise ParserError(ErrorCode.FILE_TOO_LARGE)
    try:
        actual_size = path.stat().st_size
    except OSError as exc:
        raise ParserError(ErrorCode.CORRUPT_DOCUMENT) from exc
    if actual_size != size_bytes:
        raise ParserError(ErrorCode.CORRUPT_DOCUMENT)

    normalized_mime = normalize_declared_mime_type(declared_mime_type)
    _validate_declared_mime(extension, normalized_mime)

    if extension == "pdf":
        _validate_pdf(path)
    elif extension in {"docx", "pptx", "xlsx"}:
        validate_ooxml_archive(path, extension, settings)
    elif extension in {"html", "md", "csv", "txt", "json"}:
        _validate_text_structure(path, extension)

    return DocumentInput(
        path=path,
        original_name=original_name,
        extension=extension,
        declared_mime_type=normalized_mime,
        detected_mime_type=CANONICAL_MIME_TYPES[extension],
        size_bytes=size_bytes,
        sha256=sha256,
    )
