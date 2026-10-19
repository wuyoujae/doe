# Origin: pptx2html/server/pptx_writer.py::_svg_raster_dimensions
from __future__ import annotations
from doe_export.pptx.writer.shared import ET
from doe_export.pptx.writer.shared import MAX_IMAGE_PIXELS, MAX_SVG_RASTER_AXIS, math
from doe_export.pptx.writer.geometry._svg_length_px import _svg_length_px
from doe_export.pptx.writer.geometry._svg_view_box import _svg_view_box

def _svg_raster_dimensions(root: ET.Element) -> tuple[int, int]:
    view_box = _svg_view_box(root.get("viewBox") or root.get("viewbox"))
    width = _svg_length_px(root.get("width"))
    height = _svg_length_px(root.get("height"))
    aspect = view_box[0] / view_box[1] if view_box else None

    if width is None and height is None and view_box:
        width, height = view_box
    elif width is None and height is not None and aspect:
        width = height * aspect
    elif height is None and width is not None and aspect:
        height = width / aspect

    width = width if width is not None else 300.0
    height = height if height is not None else 150.0
    if not math.isfinite(width) or not math.isfinite(height) or width <= 0 or height <= 0:
        raise ValueError("SVG dimensions must be finite positive values")

    scale = min(
        1.0,
        MAX_SVG_RASTER_AXIS / width,
        MAX_SVG_RASTER_AXIS / height,
        math.sqrt(MAX_IMAGE_PIXELS / (width * height)),
    )
    return max(1, int(round(width * scale))), max(1, int(round(height * scale)))

_svg_raster_dimensions.__module__ = 'pptx2html.server.pptx_writer'
