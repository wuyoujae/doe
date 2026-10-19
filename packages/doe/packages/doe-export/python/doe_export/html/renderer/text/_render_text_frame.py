# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_text_frame
from __future__ import annotations
from doe_export.html.renderer.shared import Shape, TextFrame

def _render_text_frame(self, tf: TextFrame, shape: Shape | None = None) -> str:
    tf_style = self._text_frame_style(tf)
    if shape and shape.text_rect:
        rect = shape.text_rect
        left = rect.left
        top = rect.top
        width = max(0.0, rect.right - rect.left)
        height = max(0.0, rect.bottom - rect.top)
        tf_style.extend(
            [
                "position:absolute",
                f"left:{left:.4f}%",
                f"top:{top:.4f}%",
                f"width:{width:.4f}%",
                f"height:{height:.4f}%",
            ]
        )
    paras = self._render_text_frame_paragraphs(tf)
    return (
        f'<div class="pptx-text-frame" '
        f'style="{self._html_style(tf_style)}">\n'
        f'{paras}\n'
        f'</div>'
    )

_render_text_frame.__module__ = 'pptx2html.renderer.html_renderer'
_render_text_frame.__qualname__ = 'HtmlRenderer._render_text_frame'
