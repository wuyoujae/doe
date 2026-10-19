# Origin: pptx2html/server/pptx_writer.py::_alpha_to_ooxml
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _alpha_to_ooxml(value: Any) -> int | None:
    if value is None:
        return None
    try:
        alpha = float(value)
    except (TypeError, ValueError):
        return None
    if alpha > 1:
        alpha = alpha / 100.0
    return max(0, min(100000, int(round(alpha * 100000))))

_alpha_to_ooxml.__module__ = 'pptx2html.server.pptx_writer'
