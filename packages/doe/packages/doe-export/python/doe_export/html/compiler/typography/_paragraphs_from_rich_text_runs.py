# Origin: pptx2html/htmlir/compiler.py::_paragraphs_from_rich_text_runs
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Paragraph, Run
from doe_export.html.compiler.typography._append_text_runs_preserving_newlines import _append_text_runs_preserving_newlines
from doe_export.html.compiler.typography._apply_text_transform import _apply_text_transform
from doe_export.html.compiler.typography._clean_inline_text import _clean_inline_text
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.css._css_rtl import _css_rtl
from doe_export.html.compiler.css._css_tab_size_pt import _css_tab_size_pt
from doe_export.html.compiler.typography._css_text_indent_pt import _css_text_indent_pt
from doe_export.html.compiler.typography._css_white_space import _css_white_space
from doe_export.html.compiler.typography._css_word_break import _css_word_break
from doe_export.html.compiler.typography._font_from_rich_run import _font_from_rich_run
from doe_export.html.compiler.typography._preserves_spaces import _preserves_spaces
from doe_export.html.compiler.typography._text_align import _text_align
from doe_export.html.compiler.typography._trim_paragraph_runs import _trim_paragraph_runs

def _paragraphs_from_rich_text_runs(
    node: dict[str, Any],
    paragraph_computed: dict[str, Any],
    line_height_pt: float,
    visual_scale: float,
) -> list[Paragraph]:
    records = node.get("richTextRuns") if isinstance(node.get("richTextRuns"), list) else []
    if not records:
        return []

    paragraphs: list[Paragraph] = []
    current: list[Run] = []
    preserve_edge_spaces = _preserves_spaces(_css_white_space(paragraph_computed))
    text_indent_pt = _css_text_indent_pt(paragraph_computed, visual_scale)
    paragraph_font_size_px = _css_px(paragraph_computed.get("fontSize")) or 16.0
    paragraph_font_size_pt = max(1.0, paragraph_font_size_px * visual_scale * 0.75)

    def flush() -> None:
        nonlocal current
        runs = _trim_paragraph_runs(current, preserve_edge_spaces=preserve_edge_spaces)
        current = []
        if not runs:
            return
        has_tab = any("\t" in str(run.text or "") for run in runs)
        max_run_font_size = max(
            (run.font.size_pt for run in runs if run.kind != "break" and run.font is not None and run.font.size_pt),
            default=paragraph_font_size_pt,
        )
        paragraph_line_height_pt = max(line_height_pt, max_run_font_size)
        tab_size_pt = _css_tab_size_pt(
            paragraph_computed,
            paragraph_font_size_pt,
            visual_scale,
            include_default=has_tab,
        )
        paragraphs.append(
            Paragraph(
                alignment=_text_align(paragraph_computed),
                rtl=_css_rtl(paragraph_computed),
                line_spacing_pt=paragraph_line_height_pt,
                line_spacing_type="points",
                indent=text_indent_pt,
                default_tab_size=tab_size_pt,
                ea_line_break=False if _css_word_break(paragraph_computed) == "keep-all" else None,
                latin_line_break=False if _css_word_break(paragraph_computed) == "keep-all" else None,
                runs=runs,
            )
        )

    for record in records:
        if not isinstance(record, dict):
            continue
        kind = str(record.get("kind") or "text")
        if kind == "break":
            if str(record.get("breakKind") or "line") == "block":
                flush()
            elif current and current[-1].kind != "break":
                current.append(Run(kind="break"))
            continue

        computed = record.get("computed") if isinstance(record.get("computed"), dict) else paragraph_computed
        text = _clean_inline_text(str(record.get("text") or ""), computed)
        text = _apply_text_transform(text, computed.get("textTransform") or paragraph_computed.get("textTransform"))
        if not text:
            continue
        font = _font_from_rich_run(record, node, visual_scale)
        _append_text_runs_preserving_newlines(current, text, font)

    flush()
    return paragraphs

_paragraphs_from_rich_text_runs.__module__ = 'pptx2html.htmlir.compiler'
