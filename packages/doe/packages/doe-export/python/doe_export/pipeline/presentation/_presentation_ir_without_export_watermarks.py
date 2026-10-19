# Origin: pptx_pipeline.py::_presentation_ir_without_export_watermarks
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import copy
from doe_export.pipeline.presentation._shape_list_has_export_watermark import _shape_list_has_export_watermark
from doe_export.pipeline.presentation._shape_list_without_export_watermarks import _shape_list_without_export_watermarks

def _presentation_ir_without_export_watermarks(
    presentation_ir: dict[str, Any],
) -> dict[str, Any]:
    """Remove export-only markers recovered by re-importing a Prelude PPTX."""

    if not any(
        isinstance(slide, dict)
        and isinstance(slide.get("shapes"), list)
        and _shape_list_has_export_watermark(slide["shapes"])
        for slide in presentation_ir.get("slides") or []
    ):
        return presentation_ir
    cleaned = copy.deepcopy(presentation_ir)
    for slide in cleaned.get("slides") or []:
        if isinstance(slide, dict) and isinstance(slide.get("shapes"), list):
            slide["shapes"] = _shape_list_without_export_watermarks(slide["shapes"])
    return cleaned

_presentation_ir_without_export_watermarks.__module__ = 'pptx_pipeline'
