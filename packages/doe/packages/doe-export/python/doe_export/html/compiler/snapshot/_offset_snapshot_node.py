# Origin: pptx2html/htmlir/compiler.py::_offset_snapshot_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import copy

def _offset_snapshot_node(node: dict[str, Any], left: float, top: float) -> dict[str, Any]:
    shifted = copy.deepcopy(node)
    for key in ("rect", "textRect", "anonymousTextRect"):
        rect = shifted.get(key)
        if not isinstance(rect, dict):
            continue
        for field in ("left", "right"):
            if isinstance(rect.get(field), (int, float)):
                rect[field] = round(float(rect[field]) - left, 3)
        for field in ("top", "bottom"):
            if isinstance(rect.get(field), (int, float)):
                rect[field] = round(float(rect[field]) - top, 3)
    if isinstance(shifted.get("svgText"), dict):
        shifted["svgText"]["center"]["x"] -= left
        shifted["svgText"]["center"]["y"] -= top
    if isinstance(shifted.get("svgGraphic"), dict):
        graphic = shifted["svgGraphic"]
        graphic["matrix"][4] -= left
        graphic["matrix"][5] -= top
        for record in [*graphic.get("markers", []), *(item for clip in graphic.get("clips", []) for item in clip)]:
            record["matrix"][4] -= left
            record["matrix"][5] -= top
        if graphic.get("gradient"):
            for point in (graphic["gradient"]["start"], graphic["gradient"]["end"]):
                point["x"] -= left
                point["y"] -= top
    return shifted

_offset_snapshot_node.__module__ = 'pptx2html.htmlir.compiler'
