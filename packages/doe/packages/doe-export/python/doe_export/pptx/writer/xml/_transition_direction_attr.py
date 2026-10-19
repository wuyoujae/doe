# Origin: pptx2html/server/pptx_writer.py::_transition_direction_attr
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _transition_direction_attr(effect_type: str, direction: Any) -> str:
    value = str(direction)
    if effect_type == "wheel" or value.isdigit():
        return "spokes"
    if effect_type in {"randomBar", "split"} and value in {"horz", "vert"}:
        return "orient"
    if effect_type in {"cover", "pull"}:
        return "dir"
    return "dir"

_transition_direction_attr.__module__ = 'pptx2html.server.pptx_writer'
