# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._geometry_css
from __future__ import annotations
from doe_export.html.renderer.shared import GEOMETRY_CSS, Shape

@staticmethod
def _geometry_css(shape: Shape) -> str:
    if shape.geometry == "parallelogram" and shape.bounds:
        width = max(0.0001, float(shape.bounds.width))
        height = max(0.0001, float(shape.bounds.height))
        short_side = min(width, height)
        raw_adjustment = float((shape.geometry_adjustments or {}).get("adj", 25000.0))
        maximum = 100000.0 * width / short_side
        adjustment = max(0.0, min(maximum, raw_adjustment))
        offset = max(
            0.0,
            min(100.0, short_side * adjustment / (1000.0 * width)),
        )
        return (
            "clip-path:polygon("
            f"0% 100%, {offset:.4f}% 0%, 100% 0%, {100.0 - offset:.4f}% 100%"
            ");"
        )
    return GEOMETRY_CSS.get(shape.geometry or "", "")

_geometry_css.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_geometry_css.__func__.__qualname__ = 'HtmlRenderer._geometry_css'
