# Origin: htmlir_server.py::HtmlIrHttpServer
from __future__ import annotations
from doe_export.service.shared import HTTPStatus, OperationalErrorReporter, ThreadingHTTPServer, sys, threading
from doe_export.service.http.HtmlIrRequestHandler import HtmlIrRequestHandler
from doe_export.service.validation._json_response import _json_response

class HtmlIrHttpServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(
        self,
        server_address: tuple[str, int],
        runtime_token: str,
        allowed_hosts: frozenset[str],
        max_concurrency: int,
        operational_errors: OperationalErrorReporter | None = None,
    ) -> None:
        super().__init__(server_address, HtmlIrRequestHandler)
        self.runtime_token = runtime_token
        self.allowed_hosts = allowed_hosts
        self.request_semaphore = threading.BoundedSemaphore(max_concurrency)
        self.connection_semaphore = threading.BoundedSemaphore(max_concurrency)
        self.operational_errors = operational_errors or OperationalErrorReporter()

    def process_request(self, request, client_address) -> None:
        if not self.connection_semaphore.acquire(timeout=0.05):
            body = _json_response(
                {"success": False, "error": "The runtime is at its connection limit."},
                HTTPStatus.TOO_MANY_REQUESTS,
            )
            response = (
                "HTTP/1.1 429 Too Many Requests\r\n"
                "Content-Type: application/json; charset=utf-8\r\n"
                f"Content-Length: {len(body)}\r\n"
                "Cache-Control: no-store\r\n"
                "X-Content-Type-Options: nosniff\r\n"
                "Retry-After: 1\r\n"
                "Connection: close\r\n\r\n"
            ).encode("ascii") + body
            try:
                request.sendall(response)
            except OSError:
                pass
            finally:
                self.shutdown_request(request)
            return
        try:
            super().process_request(request, client_address)
        except Exception:
            self.connection_semaphore.release()
            raise

    def process_request_thread(self, request, client_address) -> None:
        try:
            super().process_request_thread(request, client_address)
        finally:
            self.connection_semaphore.release()

    def handle_error(self, request, client_address) -> None:
        error = sys.exc_info()[1]
        if isinstance(error, BaseException):
            self.operational_errors.report_exception(
                error,
                error_code="htmlir_unhandled_server_error",
                message="HTMLIR server failed outside the request handler.",
                source_layer="runtime",
                status_code=500,
                context={"operation": "server-boundary"},
            )
        super().handle_error(request, client_address)

HtmlIrHttpServer.__module__ = 'htmlir_server'
