# Origin: pptx2html/htmlir/compiler.py::_box_shadow_part
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Shadow, re
from doe_export.html.compiler.css._css_color import _css_color
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.css._first_css_color import _first_css_color
from doe_export.html.compiler.css._shadow_tokens import _shadow_tokens

def _box_shadow_part(
    raw: str,
    computed: dict[str, Any],
    sx: float,
    sy: float,
    opacity: float,
) -> Shadow | None:
    tokens = _shadow_tokens(raw)
    if not tokens:
        return None
    shadow_type = "outer"
    length_tokens: list[str] = []
    for token in tokens:
        lower = token.strip().lower()
        if lower == "inset":
            shadow_type = "inner"
            continue
        if _css_color(token) is not None or lower.startswith(("rgb(", "rgba(")):
            continue
        length_tokens.append(token)

    lengths_px: list[float] = []
    for token in length_tokens:
        if re.search(r"[-+]?\d", token):
            lengths_px.append(_css_px(token))
    if len(lengths_px) < 2:
        return None

    color = _first_css_color(raw) or _css_color(computed.get("color")) or ("000000", 1.0)
    alpha = max(0.0, min(1.0, color[1] * opacity))
    if alpha <= 0.01:
        return None

    scale = (sx + sy) / 2.0
    blur_pt = max(0.0, lengths_px[2] * scale) if len(lengths_px) >= 3 else 0.0
    spread_pt = lengths_px[3] * scale if len(lengths_px) >= 4 else 0.0
    diagnostics = ["htmlir:box-shadow"]
    if shadow_type == "inner":
        diagnostics.append("htmlir:box-shadow-inset")
    if abs(spread_pt) > 0.001:
        diagnostics.append("htmlir:box-shadow-spread-ignored")
    if len(lengths_px) > 4:
        diagnostics.append("htmlir:box-shadow-extra-lengths-ignored")

    return Shadow(
        type=shadow_type,
        offset_x=round(lengths_px[0] * sx, 3),
        offset_y=round(lengths_px[1] * sy, 3),
        blur_pt=round(blur_pt, 3),
        color=color[0],
        alpha=alpha if alpha < 0.999 else None,
        diagnostics=diagnostics,
    )

_box_shadow_part.__module__ = 'pptx2html.htmlir.compiler'
