"""Resource budgets for untrusted OPC/OOXML ZIP packages."""

from __future__ import annotations

import io
import stat
import zipfile
from pathlib import PurePosixPath

MAX_ARCHIVE_ENTRIES = 5_000
MAX_ARCHIVE_UNCOMPRESSED_BYTES = 300 * 1024 * 1024
MAX_ARCHIVE_ENTRY_BYTES = 128 * 1024 * 1024
MAX_ARCHIVE_COMPRESSION_RATIO = 200
MAX_ARCHIVE_NAME_BYTES = 1_024


def validate_pptx_archive(archive: zipfile.ZipFile) -> dict[str, zipfile.ZipInfo]:
    entries = archive.infolist()
    if not entries or len(entries) > MAX_ARCHIVE_ENTRIES:
        raise ValueError(f"PPTX package cannot exceed {MAX_ARCHIVE_ENTRIES} ZIP entries.")

    validated: dict[str, zipfile.ZipInfo] = {}
    total_uncompressed = 0
    for entry in entries:
        normalized = _normalized_archive_name(entry.filename)
        if normalized in validated:
            raise ValueError("PPTX package contains duplicate ZIP entry names.")
        if entry.flag_bits & 0x1:
            raise ValueError("Encrypted PPTX packages are not supported.")
        unix_mode = (entry.external_attr >> 16) & 0o170000
        if unix_mode == stat.S_IFLNK:
            raise ValueError("PPTX package cannot contain symbolic links.")
        if entry.file_size > MAX_ARCHIVE_ENTRY_BYTES:
            raise ValueError("PPTX package contains an oversized ZIP entry.")
        if entry.file_size >= 1024 * 1024:
            ratio = entry.file_size / max(entry.compress_size, 1)
            if ratio > MAX_ARCHIVE_COMPRESSION_RATIO:
                raise ValueError("PPTX package exceeds the compression-ratio budget.")
        total_uncompressed += entry.file_size
        if total_uncompressed > MAX_ARCHIVE_UNCOMPRESSED_BYTES:
            raise ValueError("PPTX expanded size exceeds 300 MiB.")
        validated[normalized] = entry

    if "[Content_Types].xml" not in validated or "ppt/presentation.xml" not in validated:
        raise ValueError("PPTX package is missing required OOXML parts.")
    if any(name.lower().endswith("vbaproject.bin") for name in validated):
        raise ValueError("Macro-enabled PowerPoint packages are not supported.")
    return validated


def read_archive_entry(
    archive: zipfile.ZipFile,
    entry: zipfile.ZipInfo,
    *,
    max_bytes: int = MAX_ARCHIVE_ENTRY_BYTES,
) -> bytes:
    limit = min(max_bytes, MAX_ARCHIVE_ENTRY_BYTES)
    if entry.file_size > limit:
        raise ValueError(f"ZIP entry cannot exceed {limit} bytes.")
    output = io.BytesIO()
    with archive.open(entry, "r") as stream:
        while chunk := stream.read(min(64 * 1024, limit + 1 - output.tell())):
            output.write(chunk)
            if output.tell() > limit:
                raise ValueError(f"ZIP entry cannot exceed {limit} bytes.")
    payload = output.getvalue()
    if len(payload) != entry.file_size:
        raise ValueError("ZIP entry size does not match its directory record.")
    return payload


def _normalized_archive_name(name: str) -> str:
    if not name or len(name.encode("utf-8")) > MAX_ARCHIVE_NAME_BYTES or "\x00" in name:
        raise ValueError("PPTX package contains an invalid ZIP entry name.")
    normalized = name.replace("\\", "/")
    path = PurePosixPath(normalized)
    if path.is_absolute() or ".." in path.parts:
        raise ValueError("PPTX package contains an unsafe entry path.")
    return path.as_posix()
