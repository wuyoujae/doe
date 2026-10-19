# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_picture
from __future__ import annotations
from doe_export.html.renderer.shared import Shape, html

def _render_picture(self, shape: Shape, base_style: list[str]) -> str:
    img_html = ""
    if shape.image:
        src = self._image_src(shape.image)
        alt = html.escape(shape.name or "", quote=True)
        geometry_style = self._geometry_css(shape)
        clip_style = (
            f' style="{html.escape(geometry_style, quote=True)}"'
            if geometry_style
            else ""
        )
        if not src:
            placeholder_style = self._html_style(
                self._missing_image_placeholder_styles()
            )
            img_html = (
                f'<div class="pptx-image-clip"{clip_style}>'
                f'<div class="pptx-image-placeholder" role="img" '
                f'aria-label="{alt}" style="{placeholder_style}"></div>'
                '</div>'
            )
        elif shape.image.tile:
            width = shape.bounds.width if shape.bounds else 100.0
            height = shape.bounds.height if shape.bounds else 100.0
            tile_style = self._html_style(
                self._image_background_styles(shape.image, width, height)
            )
            img_html = (
                f'<div class="pptx-image-clip"{clip_style}>'
                f'<div class="pptx-image-tile" role="img" aria-label="{alt}" '
                f'style="{tile_style}"></div>'
                '</div>'
            )
        else:
            src_attr = html.escape(src, quote=True)
            img_style = self._image_style(shape.image)
            img_html = (
                f'<div class="pptx-image-clip"{clip_style}>'
                f'<img src="{src_attr}" style="{html.escape(img_style, quote=True)}" '
                f'alt="{alt}">'
                '</div>'
            )

    return (
        f'<div class="pptx-shape pptx-picture" '
        f'style="{self._html_style(base_style)}">\n'
        f'{img_html}\n'
        f'</div>'
    )

_render_picture.__module__ = 'pptx2html.renderer.html_renderer'
_render_picture.__qualname__ = 'HtmlRenderer._render_picture'
