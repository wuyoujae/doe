# Origin: pptx2html/htmlir/compiler.py::_css_clips_overflow
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _css_clips_overflow(computed: dict[str, Any]) -> bool:
    values = {
        str(computed.get("overflow") or "").strip().lower(),
        str(computed.get("overflowX") or "").strip().lower(),
        str(computed.get("overflowY") or "").strip().lower(),
    }
    return bool(values.intersection({"hidden", "clip"}))

_css_clips_overflow.__module__ = 'pptx2html.htmlir.compiler'
