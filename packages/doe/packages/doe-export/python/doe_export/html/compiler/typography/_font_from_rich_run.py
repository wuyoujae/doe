# Origin: pptx2html/htmlir/compiler.py::_font_from_rich_run
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Font
from doe_export.html.compiler.shared import TABLE_CELL_TAGS
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_color import _css_color
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.css._css_rtl_for_run import _css_rtl_for_run
from doe_export.html.compiler.typography._css_vertical_align_baseline import _css_vertical_align_baseline
from doe_export.html.compiler.css._element_opacity import _element_opacity
from doe_export.html.compiler.typography._font_from_computed import _font_from_computed
from doe_export.html.compiler.typography._uses_text_decoration_overlay import _uses_text_decoration_overlay

def _font_from_rich_run(record: dict[str, Any], node: dict[str, Any], visual_scale: float) -> Font:
    computed = record.get("computed") if isinstance(record.get("computed"), dict) else _computed(node)
    font_size_px = _css_px(computed.get("fontSize")) or _css_px(_computed(node).get("fontSize")) or 16.0
    font_size_pt = max(1.0, font_size_px * visual_scale * 0.75)
    opacity = max(0.0, min(1.0, _css_float(record.get("effectiveOpacity"), _element_opacity(node))))
    font = _font_from_computed(
        computed,
        font_size_pt,
        opacity,
        visual_scale=visual_scale,
        text_decoration_overlay=(
            str(record.get("path") or "") == str(node.get("path") or "")
            and _uses_text_decoration_overlay(node)
        ),
    )
    font.rtl = _css_rtl_for_run(computed, _computed(node))
    href = record.get("href")
    if isinstance(href, str) and href.strip():
        font.hyperlink_url = href.strip()
    background = _css_color(computed.get("backgroundColor"))
    if background and background[1] > 0.01 and str(record.get("path") or "") != str(node.get("path") or ""):
        font.highlight = background[0]
    vertical_align = str(computed.get("verticalAlign") or "").strip().lower()
    tag = str(record.get("tag") or "").strip().lower()
    if tag in TABLE_CELL_TAGS and str(computed.get("display") or "").strip().lower() == "table-cell":
        font.baseline = None
    elif vertical_align == "super" or tag == "sup":
        font.baseline = 0.3
    elif vertical_align == "sub" or tag == "sub":
        font.baseline = -0.25
    else:
        font.baseline = _css_vertical_align_baseline(computed, font_size_pt, visual_scale)
    return font

_font_from_rich_run.__module__ = 'pptx2html.htmlir.compiler'
