# Origin: pptx2html/htmlir/compiler.py::_canonical_inline_bounds
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds, CSS_PX_TO_PT, math, re
from doe_export.html.compiler.css._css_float import _css_float

def _canonical_inline_bounds(node: dict[str, Any]) -> Bounds | None:
    attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
    style = str(attrs.get("style") or "")
    values: dict[str, float] = {}
    for field in ("left", "top", "width", "height"):
        matches = list(
            re.finditer(
                rf"(?:^|;)\s*{field}\s*:\s*"
                r"([-+]?(?:\d+(?:\.\d*)?|\.\d+))\s*(pt|px)\b",
                style,
                flags=re.IGNORECASE,
            )
        )
        if not matches:
            return None
        value = _css_float(matches[-1].group(1), math.nan)
        if not math.isfinite(value):
            return None
        if matches[-1].group(2).lower() == "px":
            value *= CSS_PX_TO_PT
        values[field] = value
    if values["width"] < 0 or values["height"] < 0:
        return None
    return Bounds(
        left=values["left"],
        top=values["top"],
        width=values["width"],
        height=values["height"],
    )

_canonical_inline_bounds.__module__ = 'pptx2html.htmlir.compiler'
