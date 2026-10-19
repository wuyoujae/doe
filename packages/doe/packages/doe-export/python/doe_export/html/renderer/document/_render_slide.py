# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_slide
from __future__ import annotations

def _render_slide(self, slide, active: bool = False) -> str:
    shapes_html = "\n".join(
        self._render_shape(s) for s in slide.shapes
    )
    w = self._slide_w
    h = self._slide_h
    classes = "pptx-slide active" if active else "pptx-slide"
    styles = [f"width:{w:.3f}pt", f"height:{h:.3f}pt"]
    if slide.background and slide.background.fill:
        styles.extend(self._background_fill_styles(slide.background.fill, w, h))
    return (
        f'<div class="{classes}" '
        f'data-width="{w}" data-height="{h}" '
        f'style="{self._html_style(styles)}">\n'
        f'{shapes_html}\n'
        f'</div>'
    )

_render_slide.__module__ = 'pptx2html.renderer.html_renderer'
_render_slide.__qualname__ = 'HtmlRenderer._render_slide'
