# Origin: pptx2html/server/pptx_writer.py::_transition_speed_from_duration
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.xml._safe_int import _safe_int

def _transition_speed_from_duration(duration_ms: Any) -> str | None:
    if duration_ms is None:
        return None
    duration = _safe_int(duration_ms, 700)
    if duration <= 500:
        return "fast"
    if duration >= 900:
        return "slow"
    return "med"

_transition_speed_from_duration.__module__ = 'pptx2html.server.pptx_writer'
