from __future__ import annotations

import ipaddress
import json
import threading
import traceback
import uuid
from dataclasses import dataclass
from urllib import error, request
from urllib.parse import urlparse

from otherone_file_parser.config import ConfigurationError, Settings


@dataclass(frozen=True, slots=True)
class ErrorLocation:
    source_file: str = ""
    source_line: int | None = None
    function_name: str = ""


class _NoRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: ANN001
        return None


class OperationalErrorReporter:
    def __init__(self, settings: Settings) -> None:
        self._endpoint = (
            _validate_endpoint(settings.error_ingest_url) if settings.error_ingest_url else None
        )
        self._token = settings.error_ingest_token or ""
        self._environment = settings.environment
        self._release = settings.release
        self._capacity = threading.BoundedSemaphore(16)
        self._opener = request.build_opener(request.ProxyHandler({}), _NoRedirect())

    def report_exception(
        self,
        exception: BaseException,
        *,
        error_code: str,
        message: str,
        source_layer: str,
        severity: str = "error",
        route: str = "",
        method: str = "",
        status_code: int | None = None,
        trace_id: str = "",
        context: dict[str, str] | None = None,
    ) -> None:
        if not self._endpoint or not self._token or not self._capacity.acquire(blocking=False):
            return
        location = _exception_location(exception)
        payload = {
            "eventId": str(uuid.uuid4()),
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
            "traceId": trace_id,
            "context": context or {},
        }
        threading.Thread(
            target=self._send,
            args=(payload,),
            name="yrkie-parser-error-reporter",
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
                    "X-Yrkie-Error-Service": "file-parser",
                },
            )
            with self._opener.open(outbound, timeout=2) as response:
                response.read(1024)
        except (OSError, error.HTTPError, error.URLError, TimeoutError):
            pass
        finally:
            self._capacity.release()


def _validate_endpoint(value: str) -> str:
    parsed = urlparse(value.strip())
    try:
        loopback = (
            parsed.hostname == "localhost"
            or ipaddress.ip_address(parsed.hostname or "").is_loopback
        )
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
        raise ConfigurationError(
            "ADMIN_ERROR_INGEST_URL must use the exact Admin ingestion path on loopback HTTP"
        )
    return parsed.geturl()


def _exception_location(exception: BaseException) -> ErrorLocation:
    frames = traceback.extract_tb(exception.__traceback__)
    if not frames:
        return ErrorLocation()
    frame = frames[-1]
    source_file = frame.filename.replace("\\", "/")
    for marker in ("app/", "resources/", "docs/"):
        index = source_file.find(marker)
        if index >= 0:
            source_file = source_file[index:]
            break
    if not source_file.startswith(("app/", "resources/", "docs/")):
        source_file = ""
    return ErrorLocation(source_file, frame.lineno, frame.name[:160])
