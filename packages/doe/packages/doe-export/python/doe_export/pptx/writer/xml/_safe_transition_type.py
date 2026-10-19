# Origin: pptx2html/server/pptx_writer.py::_safe_transition_type
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _safe_transition_type(value: Any) -> str:
    name = str(value or "fade")
    allowed = {
        "none",
        "fade",
        "push",
        "wipe",
        "cover",
        "pull",
        "split",
        "zoom",
        "cut",
        "blinds",
        "checker",
        "circle",
        "dissolve",
        "randomBar",
        "wheel",
    }
    return name if name in allowed else "fade"

_safe_transition_type.__module__ = 'pptx2html.server.pptx_writer'
