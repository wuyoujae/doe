from __future__ import annotations

import stat
import xml.etree.ElementTree as ET
import zipfile
from pathlib import PurePosixPath

from defusedxml.common import DefusedXmlException

from otherone_file_parser.api.errors import ErrorCode, ParserError
from otherone_file_parser.config import Settings
from otherone_file_parser.infrastructure.safe_xml import (
    MAX_XML_PART_BYTES,
    XmlArchiveBudget,
    XmlBudgetExceeded,
)

_OOXML_REQUIRED_PATH = {
    "docx": "word/document.xml",
    "pptx": "ppt/presentation.xml",
    "xlsx": "xl/workbook.xml",
}

_OOXML_CONTENT_TYPE_MARKER = {
    "docx": b"wordprocessingml.document.main+xml",
    "pptx": b"presentationml.presentation.main+xml",
    "xlsx": b"spreadsheetml.sheet.main+xml",
}


def _has_unsafe_archive_path(name: str) -> bool:
    normalized = name.replace("\\", "/")
    path = PurePosixPath(normalized)
    return (
        not name
        or "\x00" in name
        or len(name.encode("utf-8")) > 1_024
        or path.is_absolute()
        or ".." in path.parts
    )


def _read_bounded_entry(archive: zipfile.ZipFile, entry: zipfile.ZipInfo, limit: int) -> bytes:
    if entry.file_size > limit:
        raise XmlBudgetExceeded("OOXML entry is too large")
    payload = bytearray()
    with archive.open(entry, "r") as stream:
        while chunk := stream.read(min(64 * 1024, limit + 1 - len(payload))):
            payload.extend(chunk)
            if len(payload) > limit:
                raise XmlBudgetExceeded("OOXML entry is too large")
    if len(payload) != entry.file_size:
        raise ValueError("OOXML entry size does not match the ZIP directory")
    return bytes(payload)


def validate_ooxml_archive(path, extension: str, settings: Settings) -> None:
    try:
        with zipfile.ZipFile(path) as archive:
            entries = archive.infolist()
            if not entries or len(entries) > settings.max_ooxml_entries:
                raise ParserError(ErrorCode.CORRUPT_DOCUMENT)

            normalized_entries: dict[str, zipfile.ZipInfo] = {}
            for entry in entries:
                normalized = entry.filename.replace("\\", "/")
                if normalized in normalized_entries:
                    raise ParserError(ErrorCode.CORRUPT_DOCUMENT)
                normalized_entries[normalized] = entry
            names = set(normalized_entries)
            required_path = _OOXML_REQUIRED_PATH[extension]
            if "[Content_Types].xml" not in names or required_path not in names:
                raise ParserError(ErrorCode.TYPE_MISMATCH)

            total_uncompressed = 0
            for entry in entries:
                if _has_unsafe_archive_path(entry.filename):
                    raise ParserError(ErrorCode.CORRUPT_DOCUMENT)
                if entry.flag_bits & 0x1:
                    raise ParserError(ErrorCode.PASSWORD_PROTECTED)
                if ((entry.external_attr >> 16) & 0o170000) == stat.S_IFLNK:
                    raise ParserError(ErrorCode.CORRUPT_DOCUMENT)
                if entry.filename.replace("\\", "/").lower().endswith("vbaproject.bin"):
                    raise ParserError(ErrorCode.CORRUPT_DOCUMENT)

                total_uncompressed += entry.file_size
                if total_uncompressed > settings.max_ooxml_uncompressed_bytes:
                    raise ParserError(ErrorCode.FILE_TOO_LARGE)

                if entry.file_size >= 1024 * 1024:
                    ratio = entry.file_size / max(entry.compress_size, 1)
                    if ratio > settings.max_ooxml_compression_ratio:
                        raise ParserError(ErrorCode.FILE_TOO_LARGE)

            xml_budget = XmlArchiveBudget()
            content_types = b""
            for name, entry in normalized_entries.items():
                if entry.is_dir() or not name.lower().endswith((".xml", ".rels")):
                    continue
                try:
                    source = _read_bounded_entry(archive, entry, MAX_XML_PART_BYTES)
                    xml_budget.validate(source)
                except XmlBudgetExceeded as exc:
                    raise ParserError(ErrorCode.FILE_TOO_LARGE) from exc
                except (DefusedXmlException, ET.ParseError, UnicodeError, ValueError) as exc:
                    raise ParserError(ErrorCode.CORRUPT_DOCUMENT) from exc
                if name == "[Content_Types].xml":
                    content_types = source

            content_types_info = normalized_entries["[Content_Types].xml"]
            if content_types_info.file_size > 1024 * 1024:
                raise ParserError(ErrorCode.CORRUPT_DOCUMENT)
            if _OOXML_CONTENT_TYPE_MARKER[extension] not in content_types:
                raise ParserError(ErrorCode.TYPE_MISMATCH)
    except ParserError:
        raise
    except (zipfile.BadZipFile, KeyError, OSError, RuntimeError) as exc:
        raise ParserError(ErrorCode.CORRUPT_DOCUMENT) from exc
