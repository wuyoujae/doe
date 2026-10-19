# Origin: pptx2html/server/ooxml_pptx_writer.py::group_child_shape_in_ooxml_space
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.xml.finite_number import finite_number
from doe_export.pptx.ooxml.geometry.format_shape_path import format_shape_path

def group_child_shape_in_ooxml_space(
    child: dict[str, Any],
    group: dict[str, Any],
    *,
    shape_path: tuple[int, ...],
) -> dict[str, Any]:
    bounds = child.get("bounds")
    if not isinstance(bounds, dict):
        return child

    outer = group.get("bounds")
    child_space = group.get("group_bounds")
    if not isinstance(outer, dict) or not isinstance(child_space, dict):
        raise ValueError(
            f"Source-backed PPTX export cannot map group coordinates at path {format_shape_path(shape_path)}"
        )
    outer_width = finite_number(outer.get("width"))
    outer_height = finite_number(outer.get("height"))
    child_width = finite_number(child_space.get("width"))
    child_height = finite_number(child_space.get("height"))
    if outer_width <= 0 or outer_height <= 0 or child_width <= 0 or child_height <= 0:
        raise ValueError(
            f"Source-backed PPTX export found an invalid group transform at path {format_shape_path(shape_path)}"
        )

    scale_x = child_width / outer_width
    scale_y = child_height / outer_height
    converted = dict(child)
    converted["bounds"] = {
        "left": finite_number(child_space.get("left")) + finite_number(bounds.get("left")) * scale_x,
        "top": finite_number(child_space.get("top")) + finite_number(bounds.get("top")) * scale_y,
        "width": finite_number(bounds.get("width")) * scale_x,
        "height": finite_number(bounds.get("height")) * scale_y,
    }
    return converted

group_child_shape_in_ooxml_space.__module__ = 'pptx2html.server.ooxml_pptx_writer'
