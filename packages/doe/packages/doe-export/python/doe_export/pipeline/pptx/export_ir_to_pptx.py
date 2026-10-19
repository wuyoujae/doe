# Origin: pptx_pipeline.py::export_ir_to_pptx
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import Path, apply_pptx_export_watermark, embed_traditional_slide_fonts, os, remove_embedded_fonts, remove_pptx_export_watermark, tempfile, write_pptx_from_ir
from doe_export.pipeline.geometry._presentation_ir_in_export_coordinate_space import _presentation_ir_in_export_coordinate_space
from doe_export.pipeline.text_layout._presentation_ir_with_export_text_layout import _presentation_ir_with_export_text_layout
from doe_export.pipeline.presentation._presentation_ir_without_export_watermarks import _presentation_ir_without_export_watermarks
from doe_export.pipeline.pptx._source_pptx_bytes import _source_pptx_bytes
from doe_export.runtime.paths import public_root

def export_ir_to_pptx(
    presentation_ir: dict[str, Any],
    *,
    output_path: str | Path | None = None,
    source_pptx: bytes | str | Path | None = None,
    original_ir: dict[str, Any] | None = None,
    export_watermark: bool = False,
    embed_fonts: bool = True,
) -> bytes:
    """Export PresentationIR to PPTX bytes and optionally persist it to disk."""

    if not isinstance(presentation_ir, dict):
        raise TypeError("presentation_ir must be a dict.")

    export_presentation_ir = _presentation_ir_without_export_watermarks(presentation_ir)
    export_presentation_ir = _presentation_ir_in_export_coordinate_space(
        export_presentation_ir,
        original_ir=original_ir if source_pptx is not None else None,
    )
    export_presentation_ir = _presentation_ir_with_export_text_layout(
        export_presentation_ir
    )
    source_bytes = _source_pptx_bytes(source_pptx)

    if output_path is not None:
        target = Path(output_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        write_pptx_from_ir(
            export_presentation_ir,
            target,
            source_pptx=source_bytes,
            original_ir=original_ir,
        )
        persisted = target.read_bytes()
        generated = embed_traditional_slide_fonts(
            persisted,
            export_presentation_ir,
            frontend_public_root=public_root(),
        ) if embed_fonts else remove_embedded_fonts(persisted)
        payload = (
            apply_pptx_export_watermark(generated)
            if export_watermark
            else remove_pptx_export_watermark(generated)
        )
        if payload != persisted:
            target.write_bytes(payload)
        return payload

    handle = tempfile.NamedTemporaryFile(delete=False, suffix=".pptx")
    target = Path(handle.name)
    handle.close()
    try:
        write_pptx_from_ir(
            export_presentation_ir,
            target,
            source_pptx=source_bytes,
            original_ir=original_ir,
        )
        payload = target.read_bytes()
        payload = embed_traditional_slide_fonts(
            payload,
            export_presentation_ir,
            frontend_public_root=public_root(),
        ) if embed_fonts else remove_embedded_fonts(payload)
        return (
            apply_pptx_export_watermark(payload)
            if export_watermark
            else remove_pptx_export_watermark(payload)
        )
    finally:
        target.unlink(missing_ok=True)

export_ir_to_pptx.__module__ = 'pptx_pipeline'
