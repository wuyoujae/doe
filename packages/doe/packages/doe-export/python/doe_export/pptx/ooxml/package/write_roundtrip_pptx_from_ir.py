# Origin: pptx2html/server/ooxml_pptx_writer.py::write_roundtrip_pptx_from_ir
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import Path, io, validate_pptx_archive, zipfile
from doe_export.pptx.ooxml.package.OoxmlPackage import OoxmlPackage
from doe_export.pptx.ooxml.package._safe_roundtrip_source_indexes import _safe_roundtrip_source_indexes
from doe_export.pptx.ooxml.shape.shape_changed import shape_changed

def write_roundtrip_pptx_from_ir(
    ir: dict[str, Any],
    source_pptx: bytes,
    output_path: str | Path,
    *,
    original_ir: dict[str, Any] | None = None,
) -> None:
    """Patch *source_pptx* with edited IR and write a PPTX package.

    `original_ir` is optional but strongly preferred. When supplied, the writer
    uses it to distinguish real user edits from parser-resolved defaults so
    unchanged imported shapes keep their original XML.
    """

    if original_ir is not None and not shape_changed(ir, original_ir):
        with zipfile.ZipFile(io.BytesIO(source_pptx), "r") as source:
            validate_pptx_archive(source)
        Path(output_path).write_bytes(source_pptx)
        return

    package = OoxmlPackage(source_pptx)
    slides = ir.get("slides") or []
    original_slides = (original_ir or {}).get("slides") or []
    slide_parts = package.slide_parts()
    source_indexes = _safe_roundtrip_source_indexes(
        slides, original_slides, len(slide_parts)
    )
    prepared_slides = package.prepare_slide_parts(source_indexes)

    for slide_ir, (slide_part, source_index) in zip(
        slides, prepared_slides, strict=True
    ):
        original_slide = (
            original_slides[source_index] if source_index is not None else None
        )
        if original_slide is not None and not shape_changed(slide_ir, original_slide):
            continue
        package.patch_slide(slide_part, slide_ir, original_slide)

    package.write(output_path)

write_roundtrip_pptx_from_ir.__module__ = 'pptx2html.server.ooxml_pptx_writer'
