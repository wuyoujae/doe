# Origin: pptx2html/htmlir/compiler.py::_custom_clip_path_polygon_paths_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import CSS_PX_TO_PT, GeometryPath, math, re
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.geometry._css_clip_coordinate_percent import _css_clip_coordinate_percent
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.css._css_function_arguments import _css_function_arguments
from doe_export.html.compiler.css._split_css_function_args import _split_css_function_args
from doe_export.html.compiler.typography._split_css_space_tokens import _split_css_space_tokens
from doe_export.html.compiler.svg._svg_number import _svg_number

def _custom_clip_path_polygon_paths_from_node(
    node: dict[str, Any],
    bounds: Bounds,
) -> list[GeometryPath]:
    """Compile a CSS ``clip-path: polygon(...)`` into editable geometry.

    Browser computed styles intentionally preserve percentage/calc expressions
    such as ``calc(100% - 30px)``.  Resolve those expressions against the DOM
    box in CSS pixels, then store the result in the IR's normalized 0..100
    coordinate space.  Unsupported clip-path functions remain on the existing
    rectangular first-pass fallback.
    """

    computed = _computed(node)
    raw = str(computed.get("clipPath") or "").strip()
    if not re.match(r"^polygon\s*\(", raw, re.IGNORECASE):
        return []
    arguments = _split_css_function_args(_css_function_arguments(raw))
    if arguments and arguments[0].strip().lower() in {"evenodd", "nonzero"}:
        arguments = arguments[1:]
    if len(arguments) < 3:
        return []

    rect = node.get("rect") if isinstance(node.get("rect"), dict) else {}
    rect_width = _css_float(rect.get("width"), 0.0)
    rect_height = _css_float(rect.get("height"), 0.0)
    if rect_width <= 0:
        rect_width = bounds.width / CSS_PX_TO_PT
    if rect_height <= 0:
        rect_height = bounds.height / CSS_PX_TO_PT
    if rect_width <= 0 or rect_height <= 0:
        return []

    points: list[tuple[float, float]] = []
    for argument in arguments:
        coordinates = _split_css_space_tokens(argument)
        if len(coordinates) != 2:
            return []
        x = _css_clip_coordinate_percent(coordinates[0], rect_width)
        y = _css_clip_coordinate_percent(coordinates[1], rect_height)
        if x is None or y is None or not math.isfinite(x) or not math.isfinite(y):
            return []
        points.append((x, y))

    if len({(round(x, 4), round(y, 4)) for x, y in points}) < 3:
        return []
    commands = [f"M {_svg_number(points[0][0])} {_svg_number(points[0][1])}"]
    commands.extend(f"L {_svg_number(x)} {_svg_number(y)}" for x, y in points[1:])
    commands.append("Z")
    return [GeometryPath(d=" ".join(commands), fill="norm", stroke=True)]

_custom_clip_path_polygon_paths_from_node.__module__ = 'pptx2html.htmlir.compiler'
