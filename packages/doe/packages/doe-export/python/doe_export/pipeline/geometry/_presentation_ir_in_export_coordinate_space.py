# Origin: pptx_pipeline.py::_presentation_ir_in_export_coordinate_space
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import _SLIDE_COORDINATE_HEIGHT_KEY, _SLIDE_COORDINATE_WIDTH_KEY, _SOURCE_SLIDE_INDEX_KEY, copy, math
from doe_export.pipeline.geometry._positive_number import _positive_number
from doe_export.pipeline.assets._scale_fill_image_for_export import _scale_fill_image_for_export
from doe_export.pipeline.geometry._scale_shape_for_export import _scale_shape_for_export

def _presentation_ir_in_export_coordinate_space(
    presentation_ir: dict[str, Any],
    *,
    original_ir: dict[str, Any] | None,
) -> dict[str, Any]:
    """Map per-slide editor coordinates into the one size supported by PPTX."""

    target_width = _positive_number(
        (original_ir or {}).get("width"),
        _positive_number(presentation_ir.get("width"), 960.0),
    )
    target_height = _positive_number(
        (original_ir or {}).get("height"),
        _positive_number(presentation_ir.get("height"), 540.0),
    )
    presentation_width = _positive_number(presentation_ir.get("width"), target_width)
    presentation_height = _positive_number(
        presentation_ir.get("height"), target_height
    )
    scales: list[tuple[float, float]] = []
    needs_copy = (
        not math.isclose(presentation_width, target_width, abs_tol=0.0001)
        or not math.isclose(presentation_height, target_height, abs_tol=0.0001)
    )
    for slide in presentation_ir.get("slides") or []:
        if not isinstance(slide, dict):
            scales.append((1.0, 1.0))
            continue
        imported = _SOURCE_SLIDE_INDEX_KEY in slide
        source_width = _positive_number(
            slide.get(_SLIDE_COORDINATE_WIDTH_KEY),
            target_width if imported else presentation_width,
        )
        source_height = _positive_number(
            slide.get(_SLIDE_COORDINATE_HEIGHT_KEY),
            target_height if imported else presentation_height,
        )
        scale_x = target_width / source_width
        scale_y = target_height / source_height
        scales.append((scale_x, scale_y))
        needs_copy = needs_copy or not math.isclose(scale_x, 1.0, abs_tol=0.0001)
        needs_copy = needs_copy or not math.isclose(scale_y, 1.0, abs_tol=0.0001)

    if not needs_copy:
        return presentation_ir

    normalized = copy.deepcopy(presentation_ir)
    normalized["width"] = target_width
    normalized["height"] = target_height
    for slide, (scale_x, scale_y) in zip(
        normalized.get("slides") or [],
        scales,
        strict=True,
    ):
        if not isinstance(slide, dict):
            continue
        for shape in slide.get("shapes") or []:
            if isinstance(shape, dict):
                _scale_shape_for_export(shape, scale_x, scale_y)
        background = slide.get("background")
        if isinstance(background, dict):
            _scale_fill_image_for_export(background.get("fill"), scale_x, scale_y)
        slide.pop(_SLIDE_COORDINATE_WIDTH_KEY, None)
        slide.pop(_SLIDE_COORDINATE_HEIGHT_KEY, None)
    return normalized

_presentation_ir_in_export_coordinate_space.__module__ = 'pptx_pipeline'
