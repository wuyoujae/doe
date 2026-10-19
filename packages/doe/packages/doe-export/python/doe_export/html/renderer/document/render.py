# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer.render
from __future__ import annotations
from doe_export.html.renderer.shared import IRPresentation, VIEWER_CSS, VIEWER_JS

def render(self, ir: IRPresentation) -> str:
    """Render *ir* to a complete HTML document string."""
    self._ir = ir
    self._slide_w = ir.width
    self._slide_h = ir.height
    self._image_counter = 0
    self._svg_counter = 0
    self._embedded_font_families = {
        str(font.typeface).strip().lower()
        for font in (ir.embedded_fonts or [])
        if getattr(font, "typeface", None)
    }
    embedded_font_css = self._embedded_font_css(ir)

    slides_html = "\n".join(
        self._render_slide(s, i == 0) for i, s in enumerate(ir.slides)
    )
    num_slides = len(ir.slides)

    return (
        '<!DOCTYPE html>\n'
        '<html lang="zh-CN">\n'
        '<head>\n'
        '<meta charset="UTF-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        f'<title>Presentation</title>\n'
        '<style>\n'
        f'{VIEWER_CSS}\n'
        f'{embedded_font_css}\n'
        '</style>\n'
        '</head>\n'
        '<body>\n'
        '<div class="pptx-viewer">\n'
        '  <div class="pptx-stage">\n'
        f'{slides_html}\n'
        '  </div>\n'
        '  <div class="pptx-nav">\n'
        '    <button class="pptx-prev">&#8249;</button>\n'
        f'    <span class="pptx-page-info">1 / {num_slides}</span>\n'
        '    <button class="pptx-next">&#8250;</button>\n'
        '  </div>\n'
        '</div>\n'
        '<script>\n'
        f'{VIEWER_JS}\n'
        '</script>\n'
        '</body>\n'
        '</html>'
    )

render.__module__ = 'pptx2html.renderer.html_renderer'
render.__qualname__ = 'HtmlRenderer.render'
