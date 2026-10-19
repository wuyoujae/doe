# Origin: pptx_pipeline.py::_presentation_ir_with_export_text_layout
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import _LOGGER, _SOURCE_SLIDE_INDEX_KEY, copy, dataclasses, presentation_from_dict
from doe_export.pipeline.text_layout._normalize_editor_text_layout import _normalize_editor_text_layout
from doe_export.pipeline.text_layout._presentation_ir_with_legacy_layout_dirty import _presentation_ir_with_legacy_layout_dirty

def _presentation_ir_with_export_text_layout(
    presentation_ir: dict[str, Any],
) -> dict[str, Any]:
    """Normalize every pending HTML-authored frame at the PPTX boundary.

    Editor persistence normally prepares the active slide, but a session export
    can also contain legacy or never-opened slides.  Export must therefore be a
    second, authoritative normalization boundary instead of trusting that every
    page has already passed through the editor save path.
    """

    presentation = presentation_from_dict(
        _presentation_ir_with_legacy_layout_dirty(presentation_ir)
    )
    normalized_slides = []
    normalized_frame_count = 0
    unresolved_frame_count = 0
    try:
        for slide in presentation.slides:
            single_slide_presentation = dataclasses.replace(
                presentation,
                slides=[copy.deepcopy(slide)],
            )
            (
                normalized_slide_presentation,
                slide_normalized_frame_count,
                slide_unresolved_frame_count,
            ) = _normalize_editor_text_layout(single_slide_presentation)
            normalized_slides.append(normalized_slide_presentation.slides[0])
            normalized_frame_count += slide_normalized_frame_count
            unresolved_frame_count += slide_unresolved_frame_count
    finally:
        try:
            from pptx2html.htmlir.compiler import recycle_browser_snapshot_worker

            recycle_browser_snapshot_worker()
        except Exception as error:
            _LOGGER.warning(
                "Chromium worker recycle after export layout preparation failed (%s).",
                type(error).__name__,
            )
    presentation.slides = normalized_slides
    normalized = presentation
    if normalized_frame_count == 0 and unresolved_frame_count == 0:
        return presentation_ir
    if normalized_frame_count:
        _LOGGER.info(
            "Prepared %s HTML text frame(s) for editable PPTX export.",
            normalized_frame_count,
        )
    if unresolved_frame_count:
        _LOGGER.warning(
            "%s HTML text frame(s) could not be normalized before PPTX export; "
            "the existing PowerPoint wrapping fallback remains active.",
            unresolved_frame_count,
        )
    normalized_ir = dataclasses.asdict(normalized)
    for source_slide, normalized_slide in zip(
        presentation_ir.get("slides") or [],
        normalized_ir.get("slides") or [],
        strict=True,
    ):
        if (
            isinstance(source_slide, dict)
            and isinstance(normalized_slide, dict)
            and _SOURCE_SLIDE_INDEX_KEY in source_slide
        ):
            normalized_slide[_SOURCE_SLIDE_INDEX_KEY] = source_slide[
                _SOURCE_SLIDE_INDEX_KEY
            ]
    return normalized_ir

_presentation_ir_with_export_text_layout.__module__ = 'pptx_pipeline'
