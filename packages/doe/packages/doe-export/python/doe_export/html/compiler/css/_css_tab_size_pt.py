# Origin: pptx2html/htmlir/compiler.py::_css_tab_size_pt
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.css._css_computed_length_pt import _css_computed_length_pt
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.typography._tab_space_factor import _tab_space_factor

def _css_tab_size_pt(
    computed: dict[str, Any],
    font_size_pt: float,
    visual_scale: float,
    *,
    include_default: bool = False,
) -> float | None:
    raw = str(computed.get("tabSize") or "").strip().lower()
    if not raw or (raw == "8" and not include_default):
        return None
    if re.fullmatch(r"[-+]?\d+(?:\.\d+)?", raw):
        count = max(0.0, _css_float(raw, 8.0))
        # CSS numeric tab-size is a multiple of the space glyph advance. We do
        # not have browser text metrics in Python, so use a conservative Arial-
        # like space estimate close to browser and PowerPoint defaults.
        return round(count * font_size_pt * _tab_space_factor(computed), 3)
    return _css_computed_length_pt(raw, visual_scale)

_css_tab_size_pt.__module__ = 'pptx2html.htmlir.compiler'
