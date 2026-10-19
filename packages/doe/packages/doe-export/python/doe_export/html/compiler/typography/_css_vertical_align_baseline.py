# Origin: pptx2html/htmlir/compiler.py::_css_vertical_align_baseline
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.typography._line_height_pt import _line_height_pt
from doe_export.html.compiler.typography._rounded_baseline_fraction import _rounded_baseline_fraction

def _css_vertical_align_baseline(
    computed: dict[str, Any],
    font_size_pt: float,
    visual_scale: float,
) -> float | None:
    raw = str(computed.get("verticalAlign") or "").strip().lower()
    if not raw or raw in {"baseline", "initial", "inherit", "unset", "revert", "auto"}:
        return None
    if raw == "super":
        return 0.3
    if raw == "sub":
        return -0.25
    if raw.endswith("%"):
        try:
            percent = float(raw[:-1]) / 100.0
        except ValueError:
            return None
        font_size_px = _css_px(computed.get("fontSize")) or 16.0
        line_height = _line_height_pt(computed.get("lineHeight"), font_size_px, font_size_pt, visual_scale)
        return _rounded_baseline_fraction((line_height * percent) / max(1.0, font_size_pt))
    if re.search(r"[-+]?\d", raw):
        length_pt = _css_px(raw) * visual_scale * 0.75
        return _rounded_baseline_fraction(length_pt / max(1.0, font_size_pt))
    # These CSS keywords align inline boxes to line-box/font-box edges. PPTX
    # only gives text runs a baseline percentage, so keep editable text with a
    # conservative first-pass visual approximation.
    keyword_map = {
        "text-top": 0.28,
        "top": 0.28,
        "middle": 0.08,
        "text-bottom": -0.18,
        "bottom": -0.18,
    }
    return keyword_map.get(raw)

_css_vertical_align_baseline.__module__ = 'pptx2html.htmlir.compiler'
