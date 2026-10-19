# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_text_frame_paragraphs
from __future__ import annotations
from doe_export.html.renderer.shared import TextFrame

def _render_text_frame_paragraphs(self, tf: TextFrame) -> str:
    visible_paragraphs = [
        paragraph
        for paragraph in tf.paragraphs
        if not self._should_suppress_empty_bullet_paragraph(paragraph)
    ]
    counters: dict[tuple[int, str], int] = {}
    rendered: list[str] = []
    for index, paragraph in enumerate(visible_paragraphs):
        bullet_index = self._next_auto_bullet_index(paragraph, counters)
        rendered.append(
            self._render_paragraph(
                paragraph,
                tf,
                is_first=index == 0,
                is_last=index == len(visible_paragraphs) - 1,
                bullet_index=bullet_index,
            )
        )
    return "\n".join(rendered)

_render_text_frame_paragraphs.__module__ = 'pptx2html.renderer.html_renderer'
_render_text_frame_paragraphs.__qualname__ = 'HtmlRenderer._render_text_frame_paragraphs'
