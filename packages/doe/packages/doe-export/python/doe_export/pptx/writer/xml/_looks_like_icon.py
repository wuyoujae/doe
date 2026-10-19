# Origin: pptx2html/server/pptx_writer.py::_looks_like_icon
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _looks_like_icon(shape: dict[str, Any]) -> bool:
    if str(shape.get("name") or "").startswith("e-shape-"):
        return False
    return shape.get("geometry_source") == "custom" and bool(shape.get("geometry_paths")) and not shape.get("text")

_looks_like_icon.__module__ = 'pptx2html.server.pptx_writer'
