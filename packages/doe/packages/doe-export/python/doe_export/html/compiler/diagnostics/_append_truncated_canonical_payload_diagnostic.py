# Origin: pptx2html/htmlir/compiler.py::_append_truncated_canonical_payload_diagnostic
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic

def _append_truncated_canonical_payload_diagnostic(
    result: dict[str, Any],
    recovered: bool,
) -> dict[str, Any]:
    if recovered:
        result.setdefault("diagnostics", []).append(
            HtmlDiagnostic(
                "info",
                "truncated-canonical-payload-recovered",
                "Recovered a transport-truncated inert canonical IR payload before rendering.",
            ).to_dict()
        )
    return result

_append_truncated_canonical_payload_diagnostic.__module__ = 'pptx2html.htmlir.compiler'
