# Origin: pptx2html/htmlir/compiler.py::_svg_graphic_node_to_normalized_d
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.svg._svg_ellipse_path import _svg_ellipse_path
from doe_export.html.compiler.svg._svg_length import _svg_length
from doe_export.html.compiler.svg._svg_path_to_normalized_d import _svg_path_to_normalized_d
from doe_export.html.compiler.svg._svg_points import _svg_points
from doe_export.html.compiler.svg._svg_points_to_path import _svg_points_to_path
from doe_export.html.compiler.svg._svg_rect_path import _svg_rect_path

def _svg_graphic_node_to_normalized_d(node: dict[str, Any], view_box: tuple[float, float, float, float]) -> str | None:
    tag = str(node.get("tag") or "").lower()
    attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
    if tag == "path":
        return _svg_path_to_normalized_d(str(attrs.get("d") or ""), view_box)
    if tag == "line":
        x1 = _svg_length(attrs.get("x1"), view_box, "x")
        y1 = _svg_length(attrs.get("y1"), view_box, "y")
        x2 = _svg_length(attrs.get("x2"), view_box, "x")
        y2 = _svg_length(attrs.get("y2"), view_box, "y")
        return _svg_points_to_path([(x1, y1), (x2, y2)], view_box, close=False)
    if tag in {"polyline", "polygon"}:
        points = _svg_points(str(attrs.get("points") or ""))
        return _svg_points_to_path(points, view_box, close=(tag == "polygon"))
    if tag == "rect":
        x = _svg_length(attrs.get("x"), view_box, "x")
        y = _svg_length(attrs.get("y"), view_box, "y")
        width = max(0.0, _svg_length(attrs.get("width"), view_box, "x"))
        height = max(0.0, _svg_length(attrs.get("height"), view_box, "y"))
        if width <= 0 or height <= 0:
            return None
        rx = _svg_length(attrs.get("rx"), view_box, "x") if attrs.get("rx") is not None else 0.0
        ry = _svg_length(attrs.get("ry"), view_box, "y") if attrs.get("ry") is not None else 0.0
        if attrs.get("rx") is not None and attrs.get("ry") is None:
            ry = rx
        if attrs.get("ry") is not None and attrs.get("rx") is None:
            rx = ry
        return _svg_rect_path(x, y, width, height, rx, ry, view_box)
    if tag == "circle":
        cx = _svg_length(attrs.get("cx"), view_box, "x")
        cy = _svg_length(attrs.get("cy"), view_box, "y")
        r = max(0.0, _svg_length(attrs.get("r"), view_box, "xy"))
        return _svg_ellipse_path(cx, cy, r, r, view_box)
    if tag == "ellipse":
        cx = _svg_length(attrs.get("cx"), view_box, "x")
        cy = _svg_length(attrs.get("cy"), view_box, "y")
        rx = max(0.0, _svg_length(attrs.get("rx"), view_box, "x"))
        ry = max(0.0, _svg_length(attrs.get("ry"), view_box, "y"))
        return _svg_ellipse_path(cx, cy, rx, ry, view_box)
    return None

_svg_graphic_node_to_normalized_d.__module__ = 'pptx2html.htmlir.compiler'
