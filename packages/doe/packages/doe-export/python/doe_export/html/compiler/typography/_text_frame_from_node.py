# Origin: pptx2html/htmlir/compiler.py::_text_frame_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import Paragraph, Run, TextFrame, make_text_container_metrics
from doe_export.html.compiler.typography._apply_list_paragraph_format import _apply_list_paragraph_format
from doe_export.html.compiler.typography._apply_text_transform import _apply_text_transform
from doe_export.html.compiler.browser._browser_rendered_single_line_text import _browser_rendered_single_line_text
from doe_export.html.compiler.typography._clean_text_for_computed import _clean_text_for_computed
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_column_count import _css_column_count
from doe_export.html.compiler.css._css_column_spacing_pt import _css_column_spacing_pt
from doe_export.html.compiler.typography._css_overflow_wrap import _css_overflow_wrap
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.css._css_rtl import _css_rtl
from doe_export.html.compiler.css._css_tab_size_pt import _css_tab_size_pt
from doe_export.html.compiler.typography._css_text_frame_diagnostics import _css_text_frame_diagnostics
from doe_export.html.compiler.typography._css_text_frame_margins import _css_text_frame_margins
from doe_export.html.compiler.typography._css_text_frame_overflow import _css_text_frame_overflow
from doe_export.html.compiler.typography._css_text_indent_pt import _css_text_indent_pt
from doe_export.html.compiler.typography._css_vertical_text import _css_vertical_text
from doe_export.html.compiler.typography._css_white_space import _css_white_space
from doe_export.html.compiler.typography._css_word_break import _css_word_break
from doe_export.html.compiler.typography._css_word_wrap import _css_word_wrap
from doe_export.html.compiler.typography._font_from_node import _font_from_node
from doe_export.html.compiler.typography._line_height_pt import _line_height_pt
from doe_export.html.compiler.typography._paragraph_text_lines import _paragraph_text_lines
from doe_export.html.compiler.typography._paragraphs_from_rich_text_runs import _paragraphs_from_rich_text_runs
from doe_export.html.compiler.typography._pptx_single_line_wrap_risk import _pptx_single_line_wrap_risk
from doe_export.html.compiler.browser._set_browser_text_layout_snapshot import _set_browser_text_layout_snapshot
from doe_export.html.compiler.typography._text_align import _text_align
from doe_export.html.compiler.typography._text_visual_scale import _text_visual_scale
from doe_export.html.compiler.typography._uses_text_decoration_overlay import _uses_text_decoration_overlay

def _text_frame_from_node(
    text: str,
    node: dict[str, Any],
    sx: float,
    sy: float,
    *,
    container_bounds: Bounds | None = None,
    baseline_top_offset: float | None = None,
) -> TextFrame:
    computed = _computed(node)
    white_space = _css_white_space(computed)
    overflow_wrap = _css_overflow_wrap(computed)
    word_break = _css_word_break(computed)
    horizontal_overflow = _css_text_frame_overflow(computed.get("overflowX") or computed.get("overflow"))
    vertical_overflow = _css_text_frame_overflow(computed.get("overflowY") or computed.get("overflow"))
    visual_scale = _text_visual_scale(node, sx, sy)
    margins = _css_text_frame_margins(computed, visual_scale)
    if isinstance(node.get("anonymousTextRect"), dict):
        # Match the IR float type before hashing; hydration must not invalidate
        # the measured layout by changing integer zero margins into floats.
        margins = {"left": 0.0, "right": 0.0, "top": 0.0, "bottom": 0.0}
    text_indent_pt = _css_text_indent_pt(computed, visual_scale)
    font_size_px = _css_px(computed.get("fontSize")) or 16.0
    font_size_pt = max(1.0, font_size_px * visual_scale * 0.75)
    line_height_pt = _line_height_pt(computed.get("lineHeight"), font_size_px, font_size_pt, visual_scale)
    tab_size_pt = _css_tab_size_pt(computed, font_size_pt, visual_scale, include_default="\t" in text)
    column_count = _css_column_count(computed)
    vertical_text = _css_vertical_text(computed)
    browser_single_line = _browser_rendered_single_line_text(node, text, line_height_pt, sx, sy)
    single_line_no_wrap = browser_single_line and _pptx_single_line_wrap_risk(node, text)
    word_wrap = _css_word_wrap(white_space)
    if (node.get("anonymousTextRect") or {}).get("lineCount") == 1:
        word_wrap = False
    if word_wrap and single_line_no_wrap and not column_count and not vertical_text:
        word_wrap = False
    diagnostics = _css_text_frame_diagnostics(computed)
    if single_line_no_wrap and "htmlir:single-line-nowrap" not in diagnostics:
        diagnostics.append("htmlir:single-line-nowrap")
    paragraphs = _paragraphs_from_rich_text_runs(node, computed, line_height_pt, visual_scale)
    if not paragraphs:
        paragraphs = []
        lines = _paragraph_text_lines(text, white_space)
        if not lines:
            lines = [_clean_text_for_computed(text, computed)]
        for line in lines:
            line = _apply_text_transform(line, computed.get("textTransform"))
            paragraphs.append(
                Paragraph(
                    alignment=_text_align(computed),
                    rtl=_css_rtl(computed),
                    line_spacing_pt=line_height_pt,
                    line_spacing_type="points",
                    indent=text_indent_pt,
                    default_tab_size=tab_size_pt,
                    ea_line_break=False if word_break == "keep-all" else None,
                    latin_line_break=False if word_break == "keep-all" else None,
                    runs=[
                        Run(
                            text=line,
                            kind="text",
                            font=_font_from_node(
                                node,
                                font_size_pt,
                                visual_scale=visual_scale,
                                text_decoration_overlay=_uses_text_decoration_overlay(node),
                            ),
                        )
                    ],
                )
            )
    _apply_list_paragraph_format(node, paragraphs, visual_scale)
    text_frame = TextFrame(
        vertical_align="top",
        word_wrap=word_wrap,
        white_space=white_space,
        overflow_wrap=overflow_wrap,
        word_break=word_break,
        margins=margins,
        baseline_top_offset=baseline_top_offset,
        vertical_overflow=vertical_overflow,
        horizontal_overflow=horizontal_overflow,
        vertical_text=vertical_text,
        column_count=column_count,
        column_spacing=_css_column_spacing_pt(computed, visual_scale) if column_count else None,
        rtl_columns=True if column_count and _css_rtl(computed) else None,
        autofit_mode="none",
        diagnostics=diagnostics,
        paragraphs=paragraphs,
        style_provenance=["htmlir:computed-style"],
    )
    if container_bounds is not None:
        _set_browser_text_layout_snapshot(
            text_frame,
            [(0, node)],
            make_text_container_metrics(container_bounds.width, container_bounds.height),
        )
    return text_frame

_text_frame_from_node.__module__ = 'pptx2html.htmlir.compiler'
