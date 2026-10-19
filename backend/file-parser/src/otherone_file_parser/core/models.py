from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class DocumentInput:
    path: Path
    original_name: str
    extension: str
    declared_mime_type: str | None
    detected_mime_type: str
    size_bytes: int
    sha256: str


@dataclass(frozen=True, slots=True)
class ParsedDocument:
    original_name: str
    detected_type: str
    mime_type: str
    size_bytes: int
    sha256: str
    markdown: str
    content_chars: int
    estimated_tokens: int
    warnings: tuple[str, ...]
    duration_ms: int
