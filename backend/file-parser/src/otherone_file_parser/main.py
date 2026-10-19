from __future__ import annotations

import logging
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from otherone_file_parser import __version__
from otherone_file_parser.api.contracts import ParseErrorDetail, ParseErrorResponse
from otherone_file_parser.api.errors import ERROR_SPECS, ErrorCode, ParserError
from otherone_file_parser.api.routes import router
from otherone_file_parser.config import Settings
from otherone_file_parser.core.dispatcher import AttachmentDispatcher
from otherone_file_parser.infrastructure.body_limit import RequestBodyLimitMiddleware
from otherone_file_parser.infrastructure.logging import configure_logging
from otherone_file_parser.infrastructure.operational_errors import OperationalErrorReporter
from otherone_file_parser.infrastructure.temp_files import cleanup_stale_files
from otherone_file_parser.parsers.docling_runtime import DoclingRuntime

logger = logging.getLogger(__name__)


def _error_response(error: ParserError, request_id: str) -> JSONResponse:
    body = ParseErrorResponse(
        error=ParseErrorDetail(
            code=error.code.value,
            message=error.message,
            retryable=error.retryable,
            request_id=request_id,
        )
    )
    return JSONResponse(status_code=error.status_code, content=body.model_dump())


def create_app(
    settings: Settings | None = None,
    runtime: DoclingRuntime | None = None,
    dispatcher: AttachmentDispatcher | None = None,
) -> FastAPI:
    resolved_settings = settings or Settings.from_env()
    configure_logging(resolved_settings.log_level)
    resolved_runtime = runtime or DoclingRuntime(resolved_settings)
    resolved_dispatcher = dispatcher or AttachmentDispatcher(resolved_settings, resolved_runtime)
    operational_errors = OperationalErrorReporter(resolved_settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        removed = cleanup_stale_files(
            resolved_settings.temp_dir, resolved_settings.temp_ttl_seconds
        )
        if removed:
            logger.info(
                "stale_temp_files_removed",
                extra={"event": "stale_temp_files_removed", "removed_count": removed},
            )
        if resolved_settings.eager_init:
            try:
                await run_in_threadpool(resolved_runtime.initialize)
            except Exception as exc:
                logger.error(
                    "docling_runtime_not_ready",
                    extra={
                        "event": "docling_runtime_not_ready",
                        "exception_type": type(exc).__name__,
                    },
                )
                operational_errors.report_exception(
                    exc,
                    error_code="docling_runtime_not_ready",
                    message="File parser runtime initialization failed.",
                    source_layer="runtime",
                    severity="critical",
                    context={"operation": "runtime-initialize", "runtime": "docling"},
                )
        yield
        resolved_runtime.close()

    app = FastAPI(
        title="Yrkie File Parser",
        version=__version__,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        lifespan=lifespan,
    )
    app.state.settings = resolved_settings
    app.state.runtime = resolved_runtime
    app.state.dispatcher = resolved_dispatcher
    app.add_middleware(
        RequestBodyLimitMiddleware,
        max_bytes=resolved_settings.max_request_bytes,
        path="/v1/documents/parse",
    )

    @app.middleware("http")
    async def assign_request_id(request: Request, call_next):
        request.state.request_id = uuid.uuid4().hex
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        return response

    @app.exception_handler(ParserError)
    async def handle_parser_error(request: Request, error: ParserError) -> JSONResponse:
        request_id = error.request_id or getattr(request.state, "request_id", uuid.uuid4().hex)
        level = logging.ERROR if error.status_code >= 500 else logging.WARNING
        logger.log(
            level,
            "document_parse_failed",
            extra={
                "event": "document_parse_failed",
                "request_id": request_id,
                "error_code": error.code.value,
            },
        )
        if error.status_code >= 500:
            operational_errors.report_exception(
                error,
                error_code=error.code.value,
                message="File parser request failed.",
                source_layer="parser",
                route=request.url.path,
                method=request.method,
                status_code=error.status_code,
                trace_id=request_id,
                context={"operation": "document-parse"},
            )
        response = _error_response(error, request_id)
        if error.code is ErrorCode.PARSER_TIMEOUT:
            schedule_restart = getattr(resolved_runtime, "schedule_restart_after_timeout", None)
            if callable(schedule_restart):
                schedule_restart()
        return response

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, error: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", uuid.uuid4().hex)
        logger.error(
            "unexpected_parser_error",
            extra={
                "event": "unexpected_parser_error",
                "request_id": request_id,
                "error_code": ErrorCode.PARSER_FAILED.value,
                "exception_type": type(error).__name__,
            },
        )
        operational_errors.report_exception(
            error,
            error_code="unexpected_parser_error",
            message="File parser failed at the application boundary.",
            source_layer="parser",
            severity="critical",
            route=request.url.path,
            method=request.method,
            status_code=500,
            trace_id=request_id,
            context={"operation": "request-boundary"},
        )
        spec = ERROR_SPECS[ErrorCode.PARSER_FAILED]
        return _error_response(
            ParserError(
                ErrorCode.PARSER_FAILED,
                message=spec.message,
                retryable=spec.retryable,
                request_id=request_id,
            ),
            request_id,
        )

    app.include_router(router)
    return app
