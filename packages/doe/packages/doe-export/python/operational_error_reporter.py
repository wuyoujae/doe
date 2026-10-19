from __future__ import annotations

import ipaddress
import json
import os
import threading
import traceback
import uuid
from dataclasses import dataclass
from urllib import error, request
from urllib.parse import urlparse


@dataclass(frozen=True, slots=True)
class ErrorLocation:
    source_file: str = ""
    source_line: int | None = None
    function_name: str = ""


class _NoRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: ANN001
        return None


class OperationalErrorReporter:
    def __init__(self) -> None:
        environment = os.getenv("YRKIE_ENVIRONMENT", "development").strip().lower()
        token = os.getenv("ADMIN_ERROR_INGEST_HTMLIR_TOKEN", "").strip()
        if environment == "production" and not token:
            raise ValueError("ADMIN_ERROR_INGEST_HTMLIR_TOKEN is required in production.")
        if token and (
            not 32 <= len(token) <= 4096
            or any(character.isspace() or not character.isprintable() for character in token)
        ):
            raise ValueError(
                "ADMIN_ERROR_INGEST_HTMLIR_TOKEN must contain 32 to 4096 safe characters."
            )
        endpoint = os.getenv(
            "ADMIN_ERROR_INGEST_URL",
            "http://127.0.0.1:4434/api/internal/operational-errors",
        ).strip()
        self._endpoint = _validate_endpoint(endpoint) if token else None
        self._token = token
        self._environment = environment
        self._release = _safe_identifier(os.getenv("YRKIE_RELEASE")) or "unknown"
        self._capacity = threading.BoundedSemaphore(16)
        self._opener = request.build_opener(request.ProxyHandler({}), _NoRedirect())

    def report_exception(
        self,
        exception: BaseException,
        *,
        error_code: str,
        message: str,
        source_layer: str = "runtime",
        severity: str = "critical",
        route: str = "",
        method: str = "",
        status_code: int | None = None,
        context: dict[str, str] | None = None,
    ) -> None:
        if not self._endpoint or not self._capacity.acquire(blocking=False):
            return
        location = _exception_location(exception)
        event_id = str(uuid.uuid4())
        payload = {
            "eventId": event_id,
            "environment": self._environment,
            "release": self._release,
            "sourceLayer": source_layer,
            "severity": severity,
            "errorCode": error_code,
            "message": message,
            "sourceFile": location.source_file,
            "sourceLine": location.source_line,
            "functionName": location.function_name,
            "route": route,
            "method": method,
            "statusCode": status_code,
            "traceId": event_id,
            "context": context or {},
        }
        threading.Thread(
            target=self._send,
            args=(payload,),
            name="yrkie-htmlir-error-reporter",
            daemon=True,
        ).start()

    def _send(self, payload: dict[str, object]) -> None:
        try:
            body = json.dumps(payload, ensure_ascii=True, separators=(",", ":")).encode("utf-8")
            outbound = request.Request(
                self._endpoint,
                data=body,
                method="POST",
                headers={
                    "Authorization": f"Bearer {self._token}",
                    "Content-Type": "application/json",
                    "X-Yrkie-Error-Service": "htmlir-runtime",
                },
            )
            with self._opener.open(outbound, timeout=2) as response:
                response.read(1024)
        except (OSError, error.HTTPError, error.URLError, TimeoutError):
            pass
        finally:
            self._capacity.release()


def _validate_endpoint(value: str) -> str:
    parsed = urlparse(value)
    try:
        loopback = parsed.hostname == "localhost" or ipaddress.ip_address(parsed.hostname or "").is_loopback
    except ValueError:
        loopback = False
    if (
        parsed.scheme != "http"
        or not loopback
        or parsed.username
        or parsed.password
        or parsed.path != "/api/internal/operational-errors"
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError(
            "ADMIN_ERROR_INGEST_URL must use the exact Admin ingestion path on loopback HTTP."
        )
    return parsed.geturl()


def _exception_location(exception: BaseException) -> ErrorLocation:
    frames = traceback.extract_tb(exception.__traceback__)
    if not frames:
        return ErrorLocation()
    frame = frames[-1]
    source_file = frame.filename.replace("\\", "/")
    index = source_file.find("app/")
    source_file = source_file[index:] if index >= 0 else ""
    return ErrorLocation(source_file, frame.lineno, frame.name[:160])


def _safe_identifier(value: str | None) -> str:
    candidate = (value or "").strip()
    if 1 <= len(candidate) <= 128 and all(
        character.isascii() and (character.isalnum() or character in "._:+-")
        for character in candidate
    ):
        return candidate
    return ""
