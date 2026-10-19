# Origin: pptx2html/htmlir/compiler.py::_has_css_gap
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._has_css_gap_axis import _has_css_gap_axis

def _has_css_gap(computed: dict[str, Any]) -> bool:
    return _has_css_gap_axis(computed.get("rowGap")) or _has_css_gap_axis(computed.get("columnGap"))

_has_css_gap.__module__ = 'pptx2html.htmlir.compiler'
