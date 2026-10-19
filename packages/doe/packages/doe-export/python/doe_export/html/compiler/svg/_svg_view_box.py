# Origin: pptx2html/htmlir/compiler.py::_svg_view_box
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import re

def _svg_view_box(node: dict[str, Any], bounds: Bounds) -> tuple[float, float, float, float] | None:
    attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
    raw = str(attrs.get("viewBox") or attrs.get("viewbox") or "").strip()
    if raw:
        parts = [float(match.group(0)) for match in re.finditer(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?", raw)]
        if len(parts) >= 4 and parts[2] > 0 and parts[3] > 0:
            return parts[0], parts[1], parts[2], parts[3]
    if bounds.width > 0 and bounds.height > 0:
        return 0.0, 0.0, bounds.width, bounds.height
    return None

_svg_view_box.__module__ = 'pptx2html.htmlir.compiler'
