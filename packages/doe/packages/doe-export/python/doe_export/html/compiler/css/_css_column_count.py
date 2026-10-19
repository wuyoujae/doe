# Origin: pptx2html/htmlir/compiler.py::_css_column_count
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _css_column_count(computed: dict[str, Any]) -> int | None:
    raw = str(computed.get("columnCount") or "").strip().lower()
    if raw and raw != "auto":
        try:
            count = int(float(raw))
        except ValueError:
            count = 0
        if count > 1:
            return min(16, count)
    columns = str(computed.get("columns") or "").strip().lower()
    if columns and columns != "auto":
        for token in columns.split():
            try:
                count = int(float(token))
            except ValueError:
                continue
            if count > 1:
                return min(16, count)
    return None

_css_column_count.__module__ = 'pptx2html.htmlir.compiler'
