# Origin: pptx2html/htmlir/compiler.py::_pptx_single_line_wrap_risk
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.typography._css_overflow_wrap import _css_overflow_wrap
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.typography._css_word_break import _css_word_break
from doe_export.html.compiler.typography._is_tight_short_text_box import _is_tight_short_text_box

def _pptx_single_line_wrap_risk(node: dict[str, Any], text: str) -> bool:
    computed = _computed(node)
    if _css_overflow_wrap(computed) != "normal" or _css_word_break(computed) != "normal":
        return False
    clean = re.sub(r"\s+", " ", str(text or "")).strip()
    if not clean:
        return False
    if len(clean) <= 4 and " " not in clean:
        return True
    if abs(_css_px(computed.get("letterSpacing"))) > 0.01:
        return True
    if str(computed.get("textTransform") or "").strip().lower() == "uppercase":
        return True
    if any(char.isalpha() for char in clean) and clean.upper() == clean and len(clean) <= 64:
        return True
    return _is_tight_short_text_box(node, clean)

_pptx_single_line_wrap_risk.__module__ = 'pptx2html.htmlir.compiler'
