# Origin: pptx2html/htmlir/compiler.py::_text_shadow_part
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Shadow, re
from doe_export.html.compiler.css._css_color import _css_color
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.css._first_css_color import _first_css_color
from doe_export.html.compiler.css._shadow_tokens import _shadow_tokens

def _text_shadow_part(
    raw: str,
    computed: dict[str, Any],
    visual_scale: float,
    opacity: float,
) -> Shadow | None:
    tokens = _shadow_tokens(raw)
    if not tokens:
        return None
    length_tokens: list[str] = []
    for token in tokens:
        lower = token.strip().lower()
        if lower in {"none", "inset"}:
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

    scale = visual_scale * 0.75
    diagnostics = ["htmlir:text-shadow"]
    if len(lengths_px) > 3:
        diagnostics.append("htmlir:text-shadow-extra-lengths-ignored")

    return Shadow(
        type="outer",
        offset_x=round(lengths_px[0] * scale, 3),
        offset_y=round(lengths_px[1] * scale, 3),
        blur_pt=round(max(0.0, lengths_px[2] * scale) if len(lengths_px) >= 3 else 0.0, 3),
        color=color[0],
        alpha=alpha if alpha < 0.999 else None,
        diagnostics=diagnostics,
    )

_text_shadow_part.__module__ = 'pptx2html.htmlir.compiler'
