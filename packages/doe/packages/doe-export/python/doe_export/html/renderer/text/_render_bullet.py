# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_bullet
from __future__ import annotations
from doe_export.html.renderer.shared import Optional, html

def _render_bullet(self, para, *, bullet_index: Optional[int] = None) -> str:
    bullet = para.bullet
    if not bullet or bullet.kind == "none":
        return ""
    marker = bullet.char
    if bullet.kind == "auto":
        marker = f"{self._ordered_bullet_marker(bullet_index or bullet.start_at or 1, bullet.auto_number_scheme)}."
    if not marker:
        marker = "\u2022"

    styles = ["display:inline-block"]
    first_font, first_text = self._first_visible_run_font(para)
    font_family = None
    if bullet.font_family and not bullet.follows_text_font:
        font_family = bullet.font_family
    elif first_font is not None:
        font_family = self._first_font_family(first_font, first_text)
    if font_family:
        safe_family = font_family.replace("\\", "\\\\").replace('"', '\\"')
        styles.append(f'font-family:"{safe_family}", sans-serif')
    if bullet.size_pt:
        styles.append(f"font-size:{bullet.size_pt:.1f}pt")
    elif bullet.size_pct and first_font is not None and first_font.size_pt:
        styles.append(f"font-size:{first_font.size_pt * bullet.size_pct:.1f}pt")
    color = self._css_color(bullet.color) or (
        self._css_font_color(first_font) if first_font is not None else None
    )
    if color:
        styles.append(f"color:{color}")
    return (
        f'<span class="pptx-bullet" '
        f'style="{self._html_style(styles)}">{html.escape(marker, quote=False)} </span>'
    )

_render_bullet.__module__ = 'pptx2html.renderer.html_renderer'
_render_bullet.__qualname__ = 'HtmlRenderer._render_bullet'
