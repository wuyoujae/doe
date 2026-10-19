# Origin: pptx2html/htmlir/compiler.py::print_html_to_pdf
from __future__ import annotations
from doe_export.html.compiler.shared import base64
from doe_export.html.compiler.diagnostics.HtmlCompileError import HtmlCompileError
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic
from doe_export.html.compiler.browser._invoke_browser_snapshot import _invoke_browser_snapshot

def print_html_to_pdf(
    source: str,
    *,
    page_width_pt: float = 960.0,
    page_height_pt: float = 540.0,
    timeout_ms: int = 60000,
) -> bytes:
    """Print one complete multi-page HTML document to PDF with Chromium."""

    if not isinstance(source, str) or not source.strip():
        raise ValueError("PDF source HTML is required.")
    result = _invoke_browser_snapshot(
        {
            "command": "pdf",
            "source": source,
            "page_width_pt": page_width_pt,
            "page_height_pt": page_height_pt,
            "timeout_ms": timeout_ms,
        },
        timeout_ms=timeout_ms,
    )
    encoded = result.get("pdf_base64")
    if not isinstance(encoded, str) or not encoded:
        raise HtmlCompileError(
            "html PDF print returned no file",
            [HtmlDiagnostic("error", "pdf-missing", "Chromium returned no PDF payload.")],
        )
    return base64.b64decode(encoded)

print_html_to_pdf.__module__ = 'pptx2html.htmlir.compiler'
