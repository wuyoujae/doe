# Origin: htmlir_server.py::run_server
from __future__ import annotations
from doe_export.service.shared import OperationalErrorReporter, warm_browser_snapshot_worker
from doe_export.service.http.HtmlIrHttpServer import HtmlIrHttpServer

def run_server(
    host: str,
    port: int,
    runtime_token: str,
    allowed_hosts: frozenset[str],
    max_concurrency: int,
) -> None:
    operational_errors = OperationalErrorReporter()
    try:
        warm_browser_snapshot_worker()
    except Exception as error:
        operational_errors.report_exception(
            error,
            error_code="htmlir_browser_worker_init_failed",
            message="HTMLIR browser worker initialization failed.",
            source_layer="runtime",
            severity="critical",
            context={"operation": "runtime-initialize", "runtime": "playwright"},
        )
        raise
    server = HtmlIrHttpServer(
        (host, port),
        runtime_token=runtime_token,
        allowed_hosts=allowed_hosts,
        max_concurrency=max_concurrency,
        operational_errors=operational_errors,
    )
    print(f"yrkie htmlir runtime listening on http://{host}:{port}", flush=True)
    server.serve_forever()

run_server.__module__ = 'htmlir_server'
