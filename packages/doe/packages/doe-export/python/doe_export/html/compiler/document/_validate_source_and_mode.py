# Origin: pptx2html/htmlir/compiler.py::_validate_source_and_mode
from __future__ import annotations
from doe_export.html.compiler.diagnostics.HtmlCompileError import HtmlCompileError
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic

def _validate_source_and_mode(source: str, render_mode: str) -> None:
    if not isinstance(source, str) or not source.strip():
        raise HtmlCompileError(
            "Expected non-empty html string",
            [HtmlDiagnostic("error", "empty-source", "Expected non-empty html string.")],
        )
    normalized_mode = str(render_mode or "semantic").strip().lower()
    if normalized_mode not in {"semantic", "snapshot"}:
        raise HtmlCompileError(
            "Unsupported html render_mode",
            [HtmlDiagnostic("error", "unsupported-render-mode", f"Unsupported render_mode '{normalized_mode}'.")],
        )

_validate_source_and_mode.__module__ = 'pptx2html.htmlir.compiler'
