from __future__ import annotations

import json

from otherone_file_parser.api.errors import ErrorCode, ParserError
from otherone_file_parser.core.models import DocumentInput


def _longest_backtick_run(value: str) -> int:
    longest = 0
    current = 0
    for character in value:
        if character == "`":
            current += 1
            longest = max(longest, current)
        else:
            current = 0
    return longest


def parse_text_document(document: DocumentInput) -> tuple[str, tuple[str, ...]]:
    try:
        text = document.path.read_text(encoding="utf-8-sig")
    except (UnicodeDecodeError, OSError) as exc:
        raise ParserError(ErrorCode.TYPE_MISMATCH) from exc

    if "\x00" in text:
        raise ParserError(ErrorCode.TYPE_MISMATCH)
    if not text.strip():
        raise ParserError(ErrorCode.EMPTY_CONTENT)

    if document.extension == "txt":
        return text, ()
    if document.extension != "json":
        raise ParserError(ErrorCode.UNSUPPORTED_TYPE)

    try:
        json.loads(text)
    except json.JSONDecodeError as exc:
        raise ParserError(ErrorCode.CORRUPT_DOCUMENT) from exc
    fence = "`" * max(3, _longest_backtick_run(text) + 1)
    closing_prefix = "" if text.endswith("\n") else "\n"
    return f"{fence}json\n{text}{closing_prefix}{fence}", ()
