# Origin: pptx2html/htmlir/compiler.py::_diagnostics_from_snapshot
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic
from doe_export.html.compiler.document._optional_int import _optional_int

def _diagnostics_from_snapshot(snapshot: dict[str, Any]) -> list[HtmlDiagnostic]:
    result: list[HtmlDiagnostic] = []
    for item in snapshot.get("diagnostics") or []:
        if isinstance(item, dict):
            result.append(
                HtmlDiagnostic(
                    severity=str(item.get("severity") or "warning"),
                    code=str(item.get("code") or "snapshot-diagnostic"),
                    message=str(item.get("message") or ""),
                    line=_optional_int(item.get("line")),
                    column=_optional_int(item.get("column")),
                    tag=item.get("tag") if isinstance(item.get("tag"), str) else None,
                    attribute=item.get("attribute") if isinstance(item.get("attribute"), str) else None,
                )
            )
    for error in snapshot.get("pageErrors") or []:
        result.append(HtmlDiagnostic("warning", "page-error", str(error)))
    for message in snapshot.get("consoleMessages") or []:
        if isinstance(message, dict) and message.get("type") in {"error", "warning"}:
            result.append(
                HtmlDiagnostic(
                    "warning",
                    f"console-{message.get('type')}",
                    str(message.get("text") or ""),
                )
            )
    return result

_diagnostics_from_snapshot.__module__ = 'pptx2html.htmlir.compiler'
