# Origin: pptx_pipeline.py::_presentation_for_static_export
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import presentation_from_dict
from doe_export.pipeline.presentation._presentation_ir_without_export_watermarks import _presentation_ir_without_export_watermarks

def _presentation_for_static_export(presentation_ir: dict[str, Any]):
    if not isinstance(presentation_ir, dict):
        raise TypeError("presentation_ir must be a dict.")
    presentation = presentation_from_dict(
        _presentation_ir_without_export_watermarks(presentation_ir)
    )
    if not presentation.slides:
        raise ValueError("PresentationIR contains no slides.")
    if len(presentation.slides) > 300:
        raise ValueError("A presentation cannot contain more than 300 slides.")
    return presentation

_presentation_for_static_export.__module__ = 'pptx_pipeline'
