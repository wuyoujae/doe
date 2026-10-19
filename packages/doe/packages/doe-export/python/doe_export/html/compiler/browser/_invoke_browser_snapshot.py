# Origin: pptx2html/htmlir/compiler.py::_invoke_browser_snapshot
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Path, __file__, os, shutil, stat
from doe_export.html.compiler.diagnostics.HtmlCompileError import HtmlCompileError
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic
from doe_export.html.compiler.geometry._doe_alexandria_codepoints import _doe_alexandria_codepoints

def _invoke_browser_snapshot(payload: dict[str, Any], *, timeout_ms: int) -> dict[str, Any]:
    from doe_export.html.compiler.browser.state import _BROWSER_SNAPSHOT_WORKER
    payload = {**payload, "doe_alexandria_codepoints": _doe_alexandria_codepoints()}
    configured_node = os.environ.get("YRKIE_HTMLIR_NODE_EXECUTABLE", "").strip()
    node: str | None
    if configured_node:
        configured_path = Path(configured_node)
        try:
            resolved_node = configured_path.resolve(strict=True)
            metadata = resolved_node.stat()
        except OSError as error:
            raise HtmlCompileError(
                "the configured Node.js runtime is unavailable",
                [
                    HtmlDiagnostic(
                        "error",
                        "invalid-node-runtime",
                        "YRKIE_HTMLIR_NODE_EXECUTABLE does not resolve to the signed runtime.",
                    )
                ],
            ) from error
        if (
            not configured_path.is_absolute()
            or not stat.S_ISREG(metadata.st_mode)
            or (
                os.name == "posix"
                and (
                    metadata.st_mode & 0o022
                    or not metadata.st_mode & stat.S_IXUSR
                    or metadata.st_uid != 0
                    or metadata.st_gid != 0
                )
            )
        ):
            raise HtmlCompileError(
                "the configured Node.js runtime is unsafe",
                [
                    HtmlDiagnostic(
                        "error",
                        "invalid-node-runtime",
                        "YRKIE_HTMLIR_NODE_EXECUTABLE must select a root-owned, non-writable executable.",
                    )
                ],
            )
        node = str(resolved_node)
    else:
        node = shutil.which("node")
    if not node:
        raise HtmlCompileError(
            "Node.js is required for htmlir browser snapshots",
            [
                HtmlDiagnostic(
                    "error",
                    "missing-node",
                    "Node.js was not found on PATH; htmlir needs Node to run the Playwright snapshot helper.",
                )
            ],
        )

    script = Path(__file__).with_name("browser_snapshot.js")
    worker_timeout = max(5.0, (timeout_ms / 1000.0) + 10.0)
    return _BROWSER_SNAPSHOT_WORKER.invoke(
        node=node,
        script=script,
        payload=payload,
        timeout_seconds=worker_timeout,
    )

_invoke_browser_snapshot.__module__ = 'pptx2html.htmlir.compiler'
