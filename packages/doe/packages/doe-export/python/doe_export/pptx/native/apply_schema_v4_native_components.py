# Origin: schema_v4_native.py::apply_schema_v4_native_components
from __future__ import annotations
from .shared import Any, BytesIO, FORMULA_COMPONENT_TYPE, Iterable, Presentation, SUPPORTED_CHART_TYPES, add_native_formula
from ._add_native_chart import _add_native_chart
from ._normalize_chart_axis_ids import _normalize_chart_axis_ids
from ._number import _number
from ._remove_visual_fallback import _remove_visual_fallback

def apply_schema_v4_native_components(
    pptx_bytes: bytes,
    native_components_by_slide: Iterable[Iterable[dict[str, Any]]],
) -> bytes:
    presentation = Presentation(BytesIO(pptx_bytes))
    metadata = [list(items) for items in native_components_by_slide]
    if len(metadata) != len(presentation.slides):
        raise ValueError("Native component metadata does not match the exported slide count.")
    changed = False
    for slide, components in zip(presentation.slides, metadata, strict=True):
        for component in components:
            component_type = str(component.get("type") or "")
            if component.get("representation") == "editable-vector" and component_type in SUPPORTED_CHART_TYPES:
                continue
            if component_type in SUPPORTED_CHART_TYPES:
                _add_native_chart(slide, component)
                changed = True
            elif component_type == FORMULA_COMPONENT_TYPE:
                bounds = component.get("bounds_pt")
                if not isinstance(bounds, dict):
                    continue
                normalized_bounds = {
                    key: _number(bounds.get(key))
                    for key in ("left", "top", "width", "height")
                }
                if normalized_bounds["width"] <= 0 or normalized_bounds["height"] <= 0:
                    continue
                _remove_visual_fallback(slide, normalized_bounds)
                add_native_formula(slide, component)
                changed = True
    if not changed:
        return pptx_bytes
    output = BytesIO()
    presentation.save(output)
    return _normalize_chart_axis_ids(output.getvalue())

apply_schema_v4_native_components.__module__ = 'schema_v4_native'
