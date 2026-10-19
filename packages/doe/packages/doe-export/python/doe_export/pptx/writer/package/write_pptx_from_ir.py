# Origin: pptx2html/server/pptx_writer.py::write_pptx_from_ir
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import Path
from doe_export.pptx.writer.shared import PptxPresentation, Pt, RoundtripFallbackRequired, write_roundtrip_pptx_from_ir
from doe_export.pptx.writer.shape._add_shape import _add_shape
from doe_export.pptx.writer.xml._apply_slide_background import _apply_slide_background
from doe_export.pptx.writer.xml._apply_slide_timing import _apply_slide_timing
from doe_export.pptx.writer.xml._apply_slide_transition import _apply_slide_transition

def write_pptx_from_ir(
    ir: dict[str, Any],
    output_path: str | Path,
    *,
    source_pptx: bytes | None = None,
    original_ir: dict[str, Any] | None = None,
) -> None:
    if source_pptx:
        try:
            write_roundtrip_pptx_from_ir(
                ir, source_pptx, output_path, original_ir=original_ir
            )
        except RoundtripFallbackRequired:
            pass
        else:
            return

    prs = PptxPresentation()
    prs.slide_width = Pt(float(ir.get("width") or 960))
    prs.slide_height = Pt(float(ir.get("height") or 540))
    blank_layout = prs.slide_layouts[6]
    temp_files: list[Path] = []

    try:
        for slide_ir in ir.get("slides") or []:
            slide = prs.slides.add_slide(blank_layout)
            shape_id_map: dict[int, int] = {}
            _apply_slide_background(slide, slide_ir)
            for shape_ir in slide_ir.get("shapes") or []:
                _add_shape(slide, shape_ir, temp_files, shape_id_map=shape_id_map)
            _apply_slide_transition(slide, slide_ir.get("transition"))
            _apply_slide_timing(slide, slide_ir.get("animations") or [], shape_id_map)
        prs.save(output_path)
    finally:
        for temp_file in temp_files:
            try:
                temp_file.unlink(missing_ok=True)
            except OSError:
                pass

write_pptx_from_ir.__module__ = 'pptx2html.server.pptx_writer'
