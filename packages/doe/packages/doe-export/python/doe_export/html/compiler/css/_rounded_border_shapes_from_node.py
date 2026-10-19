# Origin: pptx2html/htmlir/compiler.py::_rounded_border_shapes_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Border, Bounds, Fill, GeometryPath, Shape
from doe_export.html.compiler.css._border_side_specs import _border_side_specs
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.geometry._css_axis_scale_from_layout import _css_axis_scale_from_layout
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.geometry._normalized_border_radius_pairs import _normalized_border_radius_pairs
from doe_export.html.compiler.svg._rounded_rect_svg_path import _rounded_rect_svg_path
from doe_export.html.compiler.structure._shape_name import _shape_name
from doe_export.html.compiler.svg._svg_path_to_normalized_d import _svg_path_to_normalized_d

def _rounded_border_shapes_from_node(node: dict[str, Any], bounds: Bounds, start_id: int, sx: float, sy: float) -> list[Shape]:
    radii = _normalized_border_radius_pairs(node, bounds)
    specs = _border_side_specs(node, sx, sy)
    if not specs or not any(x > 0 or y > 0 for x, y in radii):
        return []
    if any(spec["dash"] not in {None, "solid"} or spec["compound"] for spec in specs):
        return []
    import pathops
    from fontTools.svgLib.path import parse_path
    from fontTools.pens.svgPathPen import SVGPathPen

    computed = _computed(node)
    scale_x = _css_axis_scale_from_layout(node, bounds, axis="x")
    scale_y = _css_axis_scale_from_layout(node, bounds, axis="y")
    top, right, bottom, left = [
        _css_px(computed.get(f"border{side}Width")) * scale
        for side, scale in (("Top", scale_y), ("Right", scale_x), ("Bottom", scale_y), ("Left", scale_x))
    ]
    width, height = bounds.width, bounds.height
    inner = Bounds(left, top, max(0, width - left - right), max(0, height - top - bottom))
    ring = pathops.Path()
    parse_path(_rounded_rect_svg_path(radii, bounds), ring.getPen())
    if inner.width > 0 and inner.height > 0:
        inner_radii = [(max(0, x - dx), max(0, y - dy)) for (x, y), (dx, dy) in zip(
            radii, ((left, top), (right, top), (right, bottom), (left, bottom)))]
        hole = pathops.Path()
        parse_path(_rounded_rect_svg_path(inner_radii, inner), hole.getPen())
        hole = hole.transform(inner.width / width, 0, 0, inner.height / height,
                              100 * left / width, 100 * top / height)
        ring = pathops.op(ring, hole, pathops.PathOp.DIFFERENCE)

    outer = [(0, 0), (100, 0), (100, 100), (0, 100)]
    inset = [(100 * left / width, 100 * top / height), (100 * (width - right) / width, 100 * top / height),
             (100 * (width - right) / width, 100 * (height - bottom) / height), (100 * left / width, 100 * (height - bottom) / height)]
    same_paint = len(specs) == 4 and all((s["color"], s["alpha"]) == (specs[0]["color"], specs[0]["alpha"]) for s in specs)
    result = []
    for spec in specs[:1] if same_paint else specs:
        path = ring
        if not same_paint:
            side = ("top", "right", "bottom", "left").index(spec["side"])
            following = (side + 1) % 4
            wedge = pathops.Path()
            pen = wedge.getPen()
            points = [outer[side], outer[following], inset[following], (50, 50), inset[side]]
            pen.moveTo(points[0])
            for point in points[1:]:
                pen.lineTo(point)
            pen.closePath()
            path = pathops.op(ring, wedge, pathops.PathOp.INTERSECTION)
        pen = SVGPathPen(None)
        path.draw(pen)
        data = _svg_path_to_normalized_d(pen.getCommands(), (0, 0, 100, 100))
        if not data:
            continue
        result.append(Shape(
            type="auto_shape", name=f"{_shape_name(node, 'border')} {spec['side'] if not same_paint else 'ring'}",
            shape_id=start_id + len(result), bounds=bounds, geometry="custom", geometry_source="custom",
            geometry_paths=[GeometryPath(d=data, fill="norm", stroke=False)],
            fill=Fill(type="solid", color=spec["color"], alpha=spec["alpha"]), border=Border(no_fill=True),
            diagnostics=["htmlir:border-radius", "htmlir:border-inside-ring"],
        ))
    return result

_rounded_border_shapes_from_node.__module__ = 'pptx2html.htmlir.compiler'
