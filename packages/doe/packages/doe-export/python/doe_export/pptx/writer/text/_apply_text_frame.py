# Origin: pptx2html/server/pptx_writer.py::_apply_text_frame
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import Pt, materialize_layout_snapshot, normalize_htmlir_export_line_edges
from doe_export.pptx.writer.text._apply_paragraph_properties import _apply_paragraph_properties
from doe_export.pptx.writer.text._apply_run_font import _apply_run_font
from doe_export.pptx.writer.text._apply_text_body_properties import _apply_text_body_properties
from doe_export.pptx.writer.text._paragraph_alignment import _paragraph_alignment
from doe_export.pptx.writer.text._preserve_run_text_space import _preserve_run_text_space
from doe_export.pptx.writer.xml._vertical_anchor import _vertical_anchor

def _apply_text_frame(
    pptx_text_frame,
    text_frame: dict[str, Any],
    *,
    container_metrics: dict[str, Any] | None = None,
) -> None:
    if container_metrics is not None:
        text_frame = (
            materialize_layout_snapshot(
                text_frame,
                container_metrics=container_metrics,
            )
            or text_frame
        )
    text_frame = normalize_htmlir_export_line_edges(text_frame)
    pptx_text_frame.clear()
    pptx_text_frame.word_wrap = bool(text_frame.get("word_wrap", True))
    pptx_text_frame.vertical_anchor = _vertical_anchor(text_frame.get("vertical_align"))
    margins = text_frame.get("margins") or {}
    if margins.get("left") is not None:
        pptx_text_frame.margin_left = Pt(float(margins.get("left") or 0))
    if margins.get("right") is not None:
        pptx_text_frame.margin_right = Pt(float(margins.get("right") or 0))
    baseline_top_offset = float(text_frame.get("baseline_top_offset") or 0)
    if margins.get("top") is not None or baseline_top_offset:
        pptx_text_frame.margin_top = Pt(
            float(margins.get("top") or 0) + baseline_top_offset
        )
    if margins.get("bottom") is not None:
        pptx_text_frame.margin_bottom = Pt(float(margins.get("bottom") or 0))
    _apply_text_body_properties(pptx_text_frame, text_frame)

    paragraphs = text_frame.get("paragraphs") or []
    if not paragraphs:
        paragraphs = [{"runs": [{"text": ""}]}]
    for para_index, paragraph in enumerate(paragraphs):
        pptx_para = pptx_text_frame.paragraphs[0] if para_index == 0 else pptx_text_frame.add_paragraph()
        pptx_para.alignment = _paragraph_alignment(paragraph.get("alignment"))
        _apply_paragraph_properties(pptx_para, paragraph)
        for run_ir in paragraph.get("runs") or [{"text": ""}]:
            if run_ir.get("kind") == "break":
                pptx_para.add_line_break()
                continue
            run = pptx_para.add_run()
            text = str(run_ir.get("text") or "")
            run.text = text
            _preserve_run_text_space(run, text)
            _apply_run_font(run, run_ir.get("font") or {})

_apply_text_frame.__module__ = 'pptx2html.server.pptx_writer'
