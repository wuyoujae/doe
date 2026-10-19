# Origin: pptx2html/htmlir/compiler.py::_border_shapes_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Border, Bounds, Fill, GeometryPath, Shape
from doe_export.html.compiler.css._border_side_specs import _border_side_specs
from doe_export.html.compiler.structure._shape_name import _shape_name

def _border_shapes_from_node(node: dict[str, Any], bounds: Bounds, start_id: int, sx: float, sy: float) -> list[Shape]:
    result: list[Shape] = []
    next_id = start_id
    for spec in _border_side_specs(node, sx, sy):
        side = str(spec["side"])
        line_width = float(spec["strip_width_pt"])
        if side == "top":
            line_bounds = Bounds(bounds.left, bounds.top, bounds.width, line_width)
        elif side == "bottom":
            line_bounds = Bounds(bounds.left, bounds.top + bounds.height - line_width, bounds.width, line_width)
        elif side == "left":
            line_bounds = Bounds(bounds.left, bounds.top, line_width, bounds.height)
        else:
            line_bounds = Bounds(bounds.left + bounds.width - line_width, bounds.top, line_width, bounds.height)
        result.append(
            Shape(
                type="auto_shape",
                name=f"{_shape_name(node, 'border')} {side}",
                shape_id=next_id,
                bounds=line_bounds,
                geometry="rect",
                geometry_source="preset",
                fill=Fill(
                    type="solid",
                    color=str(spec["color"]),
                    alpha=float(spec["alpha"]) if float(spec["alpha"]) < 0.999 else None,
                ),
                border=Border(no_fill=True),
                diagnostics=[f"htmlir:border-{side}"],
            )
        )
        if spec["dash"] or spec["compound"]:
            shape = result[-1]
            shape.geometry = "custom"
            shape.geometry_source = "custom"
            shape.geometry_paths = [GeometryPath(
                d="M 0 50 L 100 50" if side in {"top", "bottom"} else "M 50 0 L 50 100",
                fill="none", stroke=True,
            )]
            shape.fill = Fill(type="none")
            shape.border = Border(width=line_width, color=str(spec["color"]),
                                  alpha=float(spec["alpha"]), dash=spec["dash"], compound=spec["compound"])
        next_id += 1
    return result

_border_shapes_from_node.__module__ = 'pptx2html.htmlir.compiler'
