# Origin: pptx2html/htmlir/compiler.py::_append_escaped_markup_diagnostic
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic

def _append_escaped_markup_diagnostic(result: dict[str, Any], recovered: bool) -> dict[str, Any]:
    if recovered:
        result.setdefault("diagnostics", []).append(
            HtmlDiagnostic(
                "info",
                "serialized-html-escape-recovered",
                "Recovered a serialized HTML wrapper or accidental extra JSON escaping layer before rendering.",
            ).to_dict()
        )
    return result

_append_escaped_markup_diagnostic.__module__ = 'pptx2html.htmlir.compiler'
