from __future__ import annotations

import hashlib
import hmac
import logging
import re
import uuid
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from starlette.datastructures import UploadFile

from otherone_file_parser import __version__
from otherone_file_parser.api.contracts import ParsedDocumentData, ParseSuccessResponse
from otherone_file_parser.api.errors import ErrorCode, ParserError
from otherone_file_parser.core.dispatcher import AttachmentDispatcher
from otherone_file_parser.core.validation import safe_extension
from otherone_file_parser.infrastructure.body_limit import RequestBodyTooLarge
from otherone_file_parser.infrastructure.temp_files import managed_temp_path

logger = logging.getLogger(__name__)
router = APIRouter()
_REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")
_COPY_CHUNK_BYTES = 1024 * 1024
_MAX_FORM_FIELD_BYTES = 1024


def _request_id(request: Request) -> str:
    value = getattr(request.state, "request_id", None)
    if isinstance(value, str) and value:
        return value
    value = uuid.uuid4().hex
    request.state.request_id = value
    return value


def _set_form_request_id(request: Request, value: object) -> None:
    if not isinstance(value, str) or not _REQUEST_ID_PATTERN.fullmatch(value):
        raise ParserError(ErrorCode.INVALID_REQUEST, request_id=_request_id(request))
    request.state.request_id = value


def _require_authorization(request: Request) -> None:
    settings = request.app.state.settings
    expected = settings.internal_token
    authorization = request.headers.get("authorization", "")
    if not authorization.startswith("Bearer "):
        raise ParserError(ErrorCode.UNAUTHORIZED, request_id=_request_id(request))
    provided = authorization.removeprefix("Bearer ")
    if not provided or not hmac.compare_digest(provided, expected):
        raise ParserError(ErrorCode.UNAUTHORIZED, request_id=_request_id(request))


def _validate_content_length(request: Request) -> None:
    raw_length = request.headers.get("content-length")
    if raw_length is None:
        return
    try:
        content_length = int(raw_length)
    except ValueError as exc:
        raise ParserError(ErrorCode.INVALID_REQUEST, request_id=_request_id(request)) from exc
    if content_length < 0:
        raise ParserError(ErrorCode.INVALID_REQUEST, request_id=_request_id(request))
    if content_length > request.app.state.settings.max_request_bytes:
        raise ParserError(ErrorCode.FILE_TOO_LARGE, request_id=_request_id(request))


async def _read_contract_form(request: Request) -> tuple[UploadFile, str]:
    content_type = request.headers.get("content-type", "").lower()
    if not content_type.startswith("multipart/form-data"):
        raise ParserError(ErrorCode.INVALID_REQUEST, request_id=_request_id(request))

    try:
        form = await request.form(
            max_files=1,
            max_fields=1,
            max_part_size=_MAX_FORM_FIELD_BYTES,
        )
    except RequestBodyTooLarge as exc:
        raise ParserError(ErrorCode.FILE_TOO_LARGE, request_id=_request_id(request)) from exc
    except Exception as exc:
        raise ParserError(ErrorCode.INVALID_REQUEST, request_id=_request_id(request)) from exc

    items = list(form.multi_items())
    open_uploads = [value for _key, value in items if isinstance(value, UploadFile)]
    try:
        if any(key not in {"file", "request_id"} for key, _value in items):
            raise ParserError(ErrorCode.INVALID_REQUEST, request_id=_request_id(request))

        files = [value for key, value in items if key == "file"]
        request_ids = [value for key, value in items if key == "request_id"]
        if len(request_ids) > 1:
            raise ParserError(ErrorCode.INVALID_REQUEST, request_id=_request_id(request))
        if request_ids:
            _set_form_request_id(request, request_ids[0])
        if len(files) != 1 or not isinstance(files[0], UploadFile):
            raise ParserError(ErrorCode.INVALID_REQUEST, request_id=_request_id(request))

        upload = files[0]
        extension = safe_extension(upload.filename)
        return upload, extension
    except Exception:
        for open_upload in open_uploads:
            await open_upload.close()
        raise


async def _persist_upload(upload: UploadFile, path: Path, max_file_bytes: int) -> tuple[int, str]:
    digest = hashlib.sha256()
    size_bytes = 0
    try:
        with path.open("wb") as output:
            while chunk := await upload.read(_COPY_CHUNK_BYTES):
                size_bytes += len(chunk)
                if size_bytes > max_file_bytes:
                    raise ParserError(ErrorCode.FILE_TOO_LARGE)
                digest.update(chunk)
                output.write(chunk)
    except ParserError:
        raise
    except OSError as exc:
        raise ParserError(ErrorCode.PARSER_FAILED) from exc
    if size_bytes == 0:
        raise ParserError(ErrorCode.EMPTY_FILE)
    return size_bytes, digest.hexdigest()


@router.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "yrkie-file-parser", "version": __version__}


@router.get("/readyz")
async def readyz(request: Request):
    ready = bool(request.app.state.runtime.ready)
    return JSONResponse(
        status_code=200 if ready else 503,
        content={
            "status": "ready" if ready else "not_ready",
            "service": "yrkie-file-parser",
            "version": __version__,
        },
    )


@router.post("/v1/documents/parse", response_model=ParseSuccessResponse)
async def parse_document(request: Request) -> ParseSuccessResponse:
    _require_authorization(request)
    _validate_content_length(request)
    upload, extension = await _read_contract_form(request)
    request_id = _request_id(request)
    settings = request.app.state.settings
    dispatcher: AttachmentDispatcher = request.app.state.dispatcher

    try:
        with managed_temp_path(settings.temp_dir, f".{extension}") as temp_path:
            size_bytes, sha256 = await _persist_upload(upload, temp_path, settings.max_file_bytes)
            parsed = await run_in_threadpool(
                dispatcher.parse_document,
                path=temp_path,
                original_name=upload.filename or "",
                declared_mime_type=upload.content_type,
                size_bytes=size_bytes,
                sha256=sha256,
            )
    except ParserError as exc:
        if exc.request_id is None:
            exc.request_id = request_id
        raise
    finally:
        await upload.close()

    logger.info(
        "document_parse_succeeded",
        extra={
            "event": "document_parse_succeeded",
            "request_id": request_id,
            "detected_type": parsed.detected_type,
            "size_bytes": parsed.size_bytes,
            "duration_ms": parsed.duration_ms,
        },
    )
    return ParseSuccessResponse(
        data=ParsedDocumentData(
            original_name=parsed.original_name,
            detected_type=parsed.detected_type,
            mime_type=parsed.mime_type,
            size_bytes=parsed.size_bytes,
            sha256=parsed.sha256,
            markdown=parsed.markdown,
            content_chars=parsed.content_chars,
            estimated_tokens=parsed.estimated_tokens,
            warnings=list(parsed.warnings),
            duration_ms=parsed.duration_ms,
        )
    )
