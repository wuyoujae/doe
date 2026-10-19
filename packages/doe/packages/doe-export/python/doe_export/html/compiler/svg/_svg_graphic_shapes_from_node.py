# Origin: pptx2html/htmlir/compiler.py::_svg_graphic_shapes_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Border, Bounds, Fill, GeometryPath, IconInfo, Shape, math, re
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.document._path_has_segment import _path_has_segment
from doe_export.html.compiler.document._path_is_same_or_descendant import _path_is_same_or_descendant
from doe_export.html.compiler.structure._shape_name import _shape_name
from doe_export.html.compiler.svg._svg_border_from_node import _svg_border_from_node
from doe_export.html.compiler.svg._svg_clipped_path import _svg_clipped_path
from doe_export.html.compiler.svg._svg_fill_from_node import _svg_fill_from_node
from doe_export.html.compiler.svg._svg_graphic_node_to_normalized_d import _svg_graphic_node_to_normalized_d
from doe_export.html.compiler.svg._svg_linear_gradient_fill import _svg_linear_gradient_fill
from doe_export.html.compiler.svg._svg_transformed_path import _svg_transformed_path
from doe_export.html.compiler.svg._svg_view_box import _svg_view_box

def _svg_graphic_shapes_from_node(
    svg_node: dict[str, Any],
    nodes: list[dict[str, Any]],
    svg_path: str,
    bounds: Bounds,
    next_shape_id: int,
) -> tuple[list[Shape], int]:
    view_box = _svg_view_box(svg_node, bounds)
    if view_box is None:
        return [], next_shape_id
    svg_attrs = svg_node.get("attributes") if isinstance(svg_node.get("attributes"), dict) else {}
    lucide_name = str(svg_attrs.get("data-lucide") or "").strip().lower()
    is_lucide = re.fullmatch(r"[a-z0-9-]+", lucide_name) is not None
    # A nested <svg> is compiled from its own node (e.g. as one Lucide icon); its
    # graphics must not be emitted a second time by the enclosing artwork.
    graphic_nodes = [
        node
        for node in nodes
        if str(node.get("tag") or "").lower() in {"path", "rect", "circle", "ellipse", "line", "polyline", "polygon"}
        and _path_is_same_or_descendant(str(node.get("path") or ""), svg_path)
        and not _path_has_segment(str(node.get("path") or "")[len(svg_path):], "svg")
        and not _path_has_segment(str(node.get("path") or ""), "defs")
        and not _path_has_segment(str(node.get("path") or ""), "clippath")
        and (is_lucide or node.get("visible", True))
    ]
    if is_lucide:
        geometry_paths: list[GeometryPath] = []
        icon_border = _svg_border_from_node(svg_node, svg_node, bounds, view_box)
        for graphic_node in graphic_nodes:
            normalized_d = _svg_graphic_node_to_normalized_d(graphic_node, view_box)
            if not normalized_d:
                continue
            geometry_paths.append(
                GeometryPath(
                    d=normalized_d,
                    fill="none",
                    stroke=icon_border is not None and not icon_border.no_fill,
                )
            )
        if geometry_paths and icon_border is not None:
            diagnostics = ["htmlir:svg", "htmlir:lucide", "htmlir:svg-first-pass"]
            if svg_attrs.get("data-lucide-requested"):
                diagnostics.extend(["htmlir:lucide-unknown", "htmlir:lucide-fallback"])
            return [
                Shape(
                    type="auto_shape",
                    name=_shape_name(svg_node, f"Lucide {lucide_name}"),
                    shape_id=next_shape_id,
                    bounds=bounds,
                    geometry="custom",
                    geometry_source="custom",
                    geometry_paths=geometry_paths,
                    fill=Fill(type="none"),
                    border=icon_border,
                    icon=IconInfo(source="lucide", name=lucide_name, variant="outline"),
                    diagnostics=diagnostics,
                )
            ], next_shape_id + 1

    shapes: list[Shape] = []
    for index, graphic_node in enumerate(graphic_nodes, start=1):
        tag = str(graphic_node.get("tag") or "").lower()
        measured = graphic_node.get("svgGraphic")
        graphic_bounds = bounds
        if isinstance(measured, dict):
            svg_rect = svg_node.get("rect") or {}
            sx = bounds.width / max(float(svg_rect.get("width") or 0), .001)
            sy = bounds.height / max(float(svg_rect.get("height") or 0), .001)
            rect = graphic_node["rect"]
            graphic_bounds = Bounds(float(rect["left"]) * sx, float(rect["top"]) * sy,
                                    max(float(rect["width"]) * sx, .75), max(float(rect["height"]) * sy, .75))
            local_d = _svg_graphic_node_to_normalized_d(graphic_node, (0, 0, 100, 100))
            normalized_d = _svg_transformed_path(local_d, measured["matrix"], graphic_bounds, sx, sy)
            if normalized_d and measured.get("clips"):
                normalized_d = _svg_clipped_path(normalized_d, measured["clips"], graphic_bounds, sx, sy)
        else:
            normalized_d = _svg_graphic_node_to_normalized_d(graphic_node, view_box)
        if not normalized_d:
            continue
        fill = _svg_linear_gradient_fill(graphic_node, graphic_bounds, sx, sy) if isinstance(measured, dict) and measured.get("gradient") else _svg_fill_from_node(graphic_node, svg_node, tag)
        border = _svg_border_from_node(graphic_node, svg_node, bounds, view_box)
        if border is not None and isinstance(measured, dict):
            matrix = measured["matrix"]
            stroke_scale = sx if measured.get("nonScalingStroke") else math.hypot(matrix[0] * sx, matrix[1] * sy)
            border.width = _css_px(_computed(graphic_node).get("strokeWidth")) * stroke_scale
        if fill is None and (border is None or border.no_fill):
            continue
        shapes.append(
            Shape(
                type="auto_shape",
                name=f"{_shape_name(svg_node, 'svg')} {tag} {index}",
                shape_id=next_shape_id,
                bounds=graphic_bounds,
                geometry="freeform",
                geometry_source="custom",
                geometry_paths=[
                    GeometryPath(
                        d=normalized_d,
                        fill="norm" if fill is not None else "none",
                        stroke=border is not None and not border.no_fill,
                    )
                ],
                fill=fill or Fill(type="none"),
                border=border or Border(no_fill=True),
                diagnostics=["htmlir:svg", f"htmlir:svg-{tag}", "htmlir:svg-first-pass"],
            )
        )
        next_shape_id += 1
        for marker in measured.get("markers", []) if isinstance(measured, dict) else []:
            marker_path = _svg_transformed_path(
                _svg_graphic_node_to_normalized_d(marker, (0, 0, 100, 100)),
                marker["matrix"], graphic_bounds, sx, sy,
            )
            if not marker_path:
                continue
            shapes.append(Shape(
                type="auto_shape", name=f"SVG marker {next_shape_id}", shape_id=next_shape_id,
                bounds=graphic_bounds, geometry="freeform", geometry_source="custom",
                geometry_paths=[GeometryPath(d=marker_path, fill="norm", stroke=False)],
                fill=_svg_fill_from_node(marker, svg_node, marker["tag"]) or Fill(type="none"),
                border=Border(no_fill=True), diagnostics=["htmlir:svg-marker"],
            ))
            next_shape_id += 1
    return shapes, next_shape_id

_svg_graphic_shapes_from_node.__module__ = 'pptx2html.htmlir.compiler'
