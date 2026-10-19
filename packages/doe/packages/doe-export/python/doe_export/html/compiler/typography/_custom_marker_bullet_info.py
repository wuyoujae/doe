# Origin: pptx2html/htmlir/compiler.py::_custom_marker_bullet_info
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import BulletInfo, CSS_PX_TO_PT
from doe_export.html.compiler.css._css_color import _css_color
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.typography._marker_text_from_content import _marker_text_from_content
from doe_export.html.compiler.typography._resolved_font_family import _resolved_font_family

def _custom_marker_bullet_info(
    list_info: dict[str, Any],
    node: dict[str, Any],
    visual_scale: float,
) -> BulletInfo | None:
    marker = list_info.get("marker") if isinstance(list_info.get("marker"), dict) else None
    if not marker:
        return None
    content = str(marker.get("content") or "").strip()
    marker_text = _marker_text_from_content(content, list_info)
    if not marker_text:
        return None

    bullet = BulletInfo(
        kind="char",
        char=marker_text,
        follows_text_color=True,
        follows_text_font=True,
        follows_text_size=True,
    )
    color = _css_color(marker.get("color"))
    if color is not None and color[1] > 0.01:
        bullet.color = color[0]
        bullet.follows_text_color = False
    font_size_px = _css_px(marker.get("fontSize"))
    if font_size_px > 0:
        bullet.size_pt = round(max(1.0, font_size_px * visual_scale * CSS_PX_TO_PT), 3)
        bullet.follows_text_size = False
    family = _resolved_font_family(marker)
    if family:
        bullet.font_family = family
        bullet.follows_text_font = False
    return bullet

_custom_marker_bullet_info.__module__ = 'pptx2html.htmlir.compiler'
