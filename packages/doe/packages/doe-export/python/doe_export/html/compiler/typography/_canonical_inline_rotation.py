# Origin: pptx2html/htmlir/compiler.py::_canonical_inline_rotation
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.css._css_float import _css_float

def _canonical_inline_rotation(node: dict[str, Any]) -> float | None:
    attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
    style = str(attrs.get("style") or "")
    matches = list(
        re.finditer(
            r"\brotate(?:z)?\(\s*([-+]?(?:\d+(?:\.\d*)?|\.\d+))deg\s*\)",
            style,
            flags=re.IGNORECASE,
        )
    )
    if not matches:
        return None
    return _css_float(matches[-1].group(1), 0.0) % 360.0

_canonical_inline_rotation.__module__ = 'pptx2html.htmlir.compiler'
