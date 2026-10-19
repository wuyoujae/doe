# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_paragraph
from __future__ import annotations
from doe_export.html.renderer.shared import Optional, TextFrame

def _render_paragraph(
    self,
    para,
    tf: Optional[TextFrame] = None,
    *,
    is_first: bool = False,
    is_last: bool = False,
    bullet_index: Optional[int] = None,
) -> str:
    if self._should_suppress_empty_bullet_paragraph(para):
        return ""
    p_style = []
    if para.alignment:
        align_map = {"l": "left", "ctr": "center", "r": "right", "just": "justify"}
        p_style.append(f"text-align:{align_map.get(para.alignment, 'left')}")
    first_font, _ = self._first_visible_run_font(para)
    paragraph_font_pt = (
        first_font.size_pt * self._font_scale(tf)
        if first_font is not None and first_font.size_pt
        else 12.0
    )
    if para.spacing_before is not None and not is_first:
        p_style.append(f"margin-top:{para.spacing_before:.2f}pt")
    elif para.spacing_before_pct is not None and not is_first:
        p_style.append(f"margin-top:{paragraph_font_pt * para.spacing_before_pct:.2f}pt")
    if para.spacing_after is not None and not is_last:
        p_style.append(f"margin-bottom:{para.spacing_after:.2f}pt")
    elif para.spacing_after_pct is not None and not is_last:
        p_style.append(f"margin-bottom:{paragraph_font_pt * para.spacing_after_pct:.2f}pt")
    if para.margin_left is not None:
        p_style.append(f"padding-left:{para.margin_left:.2f}pt")
    if para.margin_right is not None:
        p_style.append(f"padding-right:{para.margin_right:.2f}pt")
    if para.indent is not None:
        p_style.append(f"text-indent:{para.indent:.2f}pt")
    if para.rtl is not None:
        p_style.append("direction:rtl" if para.rtl else "direction:ltr")
    if para.latin_line_break is False:
        p_style.append("word-break:keep-all")
    if para.ea_line_break is False:
        p_style.append("line-break:strict")
    if para.hanging_punctuation:
        p_style.append("hanging-punctuation:first last")
    if para.default_tab_size is not None:
        p_style.append(f"tab-size:{max(0.0, float(para.default_tab_size)):.3f}pt")

    line_spacing_multiple = self._line_spacing_multiple(para, tf)
    if para.line_spacing_pt:
        p_style.append(f"line-height:{para.line_spacing_pt:.2f}pt")
    elif line_spacing_multiple:
        p_style.append(f"line-height:{line_spacing_multiple:.4f}")
    else:
        p_style.append("line-height:1")
    if tf is not None and getattr(tf, "white_space", None):
        p_style.append(f"white-space:{tf.white_space}")
        if getattr(tf, "overflow_wrap", None):
            p_style.append(f"overflow-wrap:{tf.overflow_wrap}")
        if getattr(tf, "word_break", None):
            p_style.append(f"word-break:{tf.word_break}")
    elif tf is not None and tf.word_wrap is False:
        p_style.append("white-space:pre")
        p_style.append("word-wrap:normal")
        p_style.append("overflow-wrap:normal")

    bullet = self._render_bullet(para, bullet_index=bullet_index)
    # Do not add source-formatting whitespace between inline runs. Text
    # frames commonly use ``white-space: pre/pre-wrap`` and browsers would
    # otherwise render those HTML newlines as extra visual line breaks.
    runs = "".join(self._render_run(r, tf, para) for r in para.runs)
    return (
        f'<p class="pptx-paragraph" '
        f'style="{self._html_style(p_style)}">'
        f'{bullet}{runs}'
        f'</p>'
    )

_render_paragraph.__module__ = 'pptx2html.renderer.html_renderer'
_render_paragraph.__qualname__ = 'HtmlRenderer._render_paragraph'
