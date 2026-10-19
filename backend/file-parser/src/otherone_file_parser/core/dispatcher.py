from __future__ import annotations

import math
import time
from pathlib import Path

from otherone_file_parser.api.errors import ErrorCode, ParserError
from otherone_file_parser.config import Settings
from otherone_file_parser.core.models import ParsedDocument
from otherone_file_parser.core.validation import TEXT_ADAPTER_EXTENSIONS, validate_document
from otherone_file_parser.parsers.audio import parse_audio_attachment
from otherone_file_parser.parsers.docling_runtime import DoclingRuntime
from otherone_file_parser.parsers.document import parse_docling_document
from otherone_file_parser.parsers.image import parse_image_attachment
from otherone_file_parser.parsers.text_document import parse_text_document


class AttachmentDispatcher:
    def __init__(self, settings: Settings, runtime: DoclingRuntime) -> None:
        self._settings = settings
        self._runtime = runtime

    def parse_document(
        self,
        *,
        path: Path,
        original_name: str,
        declared_mime_type: str | None,
        size_bytes: int,
        sha256: str,
    ) -> ParsedDocument:
        started = time.monotonic()
        document = validate_document(
            path=path,
            original_name=original_name,
            declared_mime_type=declared_mime_type,
            size_bytes=size_bytes,
            sha256=sha256,
            settings=self._settings,
        )

        if document.extension in TEXT_ADAPTER_EXTENSIONS:
            markdown, warnings = parse_text_document(document)
        else:
            markdown, warnings = parse_docling_document(document, self._runtime)

        content_chars = len(markdown)
        if content_chars > self._settings.max_content_chars:
            raise ParserError(ErrorCode.CONTENT_TOO_LARGE)

        return ParsedDocument(
            original_name=document.original_name,
            detected_type=document.extension,
            mime_type=document.detected_mime_type,
            size_bytes=document.size_bytes,
            sha256=document.sha256,
            markdown=markdown,
            content_chars=content_chars,
            estimated_tokens=_estimate_tokens(markdown),
            warnings=warnings,
            duration_ms=max(0, round((time.monotonic() - started) * 1000)),
        )

    def parse_image(self, *args, **kwargs):
        return parse_image_attachment(*args, **kwargs)

    def parse_audio(self, *args, **kwargs):
        return parse_audio_attachment(*args, **kwargs)


def _estimate_tokens(content: str) -> int:
    non_ascii = sum(1 for character in content if ord(character) > 127)
    ascii_count = len(content) - non_ascii
    return max(1, non_ascii + math.ceil(ascii_count / 4))
