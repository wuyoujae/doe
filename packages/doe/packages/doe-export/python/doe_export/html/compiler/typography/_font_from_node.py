# Origin: pptx2html/htmlir/compiler.py::_font_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Font
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._element_opacity import _element_opacity
from doe_export.html.compiler.typography._font_from_computed import _font_from_computed
from doe_export.html.compiler.geometry._visual_scale import _visual_scale

def _font_from_node(
    node: dict[str, Any],
    font_size_pt: float,
    *,
    visual_scale: float | None = None,
    text_decoration_overlay: bool = False,
) -> Font:
    computed = _computed(node)
    return _font_from_computed(
        computed,
        font_size_pt,
        _element_opacity(node),
        visual_scale=visual_scale if visual_scale is not None else _visual_scale(node),
        text_decoration_overlay=text_decoration_overlay,
    )

_font_from_node.__module__ = 'pptx2html.htmlir.compiler'
