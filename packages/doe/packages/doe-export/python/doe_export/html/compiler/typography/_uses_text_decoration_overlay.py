# Origin: pptx2html/htmlir/compiler.py::_uses_text_decoration_overlay
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_color import _css_color
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.typography._text_decoration_color import _text_decoration_color
from doe_export.html.compiler.typography._text_decoration_lines import _text_decoration_lines
from doe_export.html.compiler.typography._text_decoration_style import _text_decoration_style
from doe_export.html.compiler.typography._text_decoration_thickness_pt import _text_decoration_thickness_pt
from doe_export.html.compiler.geometry._visual_scale import _visual_scale

def _uses_text_decoration_overlay(node: dict[str, Any]) -> bool:
    computed = _computed(node)
    lines = _text_decoration_lines(computed)
    if not ({"underline", "line-through"} & lines):
        return False
    font_size_px = _css_px(computed.get("fontSize")) or 16.0
    font_size_pt = max(1.0, font_size_px * _visual_scale(node) * 0.75)
    style = _text_decoration_style(computed.get("textDecorationStyle"))
    width = _text_decoration_thickness_pt(computed, font_size_pt)
    text_color = _css_color(computed.get("color")) or ("000000", 1.0)
    decoration_color = _text_decoration_color(computed, 1.0)
    color_differs = decoration_color[0] != text_color[0] or abs(decoration_color[1] - text_color[1]) > 0.01
    return bool(width is not None or style != "solid" or color_differs)

_uses_text_decoration_overlay.__module__ = 'pptx2html.htmlir.compiler'
