# Origin: pptx2html/htmlir/compiler.py::_text_decoration_line_shape
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Border, Bounds, Fill, GeometryPath, Shape
from doe_export.html.compiler.structure._shape_name import _shape_name
from doe_export.html.compiler.typography._text_decoration_style_to_line import _text_decoration_style_to_line
from doe_export.html.compiler.document._wavy_decoration_path import _wavy_decoration_path

def _text_decoration_line_shape(
    *,
    node: dict[str, Any],
    kind: str,
    shape_id: int,
    bounds: Bounds,
    y: float,
    width_pt: float,
    color: str,
    alpha: float,
    style: str,
) -> Shape:
    if style == "wavy":
        wave_height = max(width_pt * 4.0, 4.0)
        wave_bounds = Bounds(bounds.left, y - wave_height / 2.0, bounds.width, wave_height)
        return Shape(
            type="auto_shape",
            name=f"{_shape_name(node, 'text-decoration')} {kind}",
            shape_id=shape_id,
            bounds=wave_bounds,
            geometry="custom",
            geometry_source="custom",
            geometry_paths=[GeometryPath(d=_wavy_decoration_path(), fill="none", stroke=True)],
            fill=Fill(type="none"),
            border=Border(
                width=round(width_pt, 3),
                color=color,
                alpha=alpha if alpha < 0.999 else None,
                cap="rnd",
                join="round",
            ),
            diagnostics=[f"htmlir:text-decoration-{kind}", "htmlir:text-decoration-wavy"],
        )
    dash, compound = ("solid", None) if style == "double" else _text_decoration_style_to_line(style)
    return Shape(
        type="connector",
        name=f"{_shape_name(node, 'text-decoration')} {kind}",
        shape_id=shape_id,
        bounds=Bounds(bounds.left, y, bounds.width, 0.0),
        geometry="line",
        geometry_source="connector",
        connector_type="line",
        fill=Fill(type="none"),
        border=Border(
            width=round(width_pt, 3),
            color=color,
            alpha=alpha if alpha < 0.999 else None,
            dash=dash,
            compound=compound,
        ),
        diagnostics=[f"htmlir:text-decoration-{kind}"],
    )

_text_decoration_line_shape.__module__ = 'pptx2html.htmlir.compiler'
