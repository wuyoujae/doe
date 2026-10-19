from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from otherone_file_parser.api.errors import ErrorCode, ParserError
from otherone_file_parser.core.models import DocumentInput
from otherone_file_parser.parsers.docling_runtime import DoclingRuntime

PARTIAL_WARNING = "文档解析完成，但部分内容可能未识别"
_ERROR_DETAIL_FIELDS = (
    "error_message",
    "message",
    "detail",
    "details",
    "component",
    "component_type",
    "module_name",
)


def _status_name(result: Any) -> str:
    raw_status = getattr(result, "status", None)
    if raw_status is None:
        return "success"
    value = getattr(raw_status, "value", raw_status)
    return str(value).lower()


def _classify_conversion_failure(value: object) -> ErrorCode:
    detail = str(value).lower()
    if "password" in detail or "encrypted" in detail:
        return ErrorCode.PASSWORD_PROTECTED
    if "maximum number of pages" in detail or "max_num_pages" in detail:
        return ErrorCode.TOO_MANY_PAGES
    if "timeout" in detail or "timed out" in detail:
        return ErrorCode.PARSER_TIMEOUT
    if "corrupt" in detail or "invalid" in detail or "malformed" in detail:
        return ErrorCode.CORRUPT_DOCUMENT
    return ErrorCode.PARSER_FAILED


def _conversion_error_details(errors: object) -> str:
    if errors is None:
        return ""
    if isinstance(errors, str | bytes):
        return str(errors)
    try:
        error_items = list(errors)
    except TypeError:
        error_items = [errors]

    details: list[str] = []
    for error in error_items:
        if isinstance(error, str | bytes):
            details.append(str(error))
            continue
        for field in _ERROR_DETAIL_FIELDS:
            value = error.get(field) if isinstance(error, Mapping) else getattr(error, field, None)
            if value is not None:
                details.append(str(value))
    return " ".join(details)


def _exceeds_page_limit(result: Any) -> bool:
    input_document = getattr(result, "input", None)
    limits = getattr(input_document, "limits", None)
    page_count = getattr(input_document, "page_count", None)
    max_num_pages = getattr(limits, "max_num_pages", None)
    return (
        isinstance(page_count, int)
        and isinstance(max_num_pages, int)
        and page_count > max_num_pages
    )


def parse_docling_document(
    document: DocumentInput, runtime: DoclingRuntime
) -> tuple[str, tuple[str, ...]]:
    try:
        result = runtime.convert(document.path)
    except ParserError:
        raise
    except Exception as exc:
        raise ParserError(_classify_conversion_failure(exc)) from exc

    status = _status_name(result)
    error_details = _conversion_error_details(getattr(result, "errors", ()))
    if _exceeds_page_limit(result):
        raise ParserError(ErrorCode.TOO_MANY_PAGES)
    if _classify_conversion_failure(error_details) is ErrorCode.PARSER_TIMEOUT:
        raise ParserError(ErrorCode.PARSER_TIMEOUT)
    is_partial = "partial" in status
    is_success = "success" in status
    if not is_success:
        raise ParserError(_classify_conversion_failure((status, error_details)))

    converted_document = getattr(result, "document", None)
    if converted_document is None:
        raise ParserError(ErrorCode.PARSER_FAILED)
    try:
        markdown = converted_document.export_to_markdown()
    except Exception as exc:
        raise ParserError(ErrorCode.PARSER_FAILED) from exc

    if not isinstance(markdown, str) or not markdown.strip():
        raise ParserError(ErrorCode.EMPTY_CONTENT)

    warnings = (PARTIAL_WARNING,) if is_partial else ()
    return markdown, warnings
