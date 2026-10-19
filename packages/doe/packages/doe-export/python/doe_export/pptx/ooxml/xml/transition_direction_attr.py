# Origin: pptx2html/server/ooxml_pptx_writer.py::transition_direction_attr
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any

def transition_direction_attr(effect_type: str, direction: Any) -> str:
    value = str(direction)
    if effect_type == "wheel" or value.isdigit():
        return "spokes"
    if effect_type in {"randomBar", "split"} and value in {"horz", "vert"}:
        return "orient"
    if effect_type in {"cover", "pull"} and value in {"l", "r", "u", "d", "lu", "ld", "ru", "rd"}:
        return "dir"
    return "dir"

transition_direction_attr.__module__ = 'pptx2html.server.ooxml_pptx_writer'
