# Origin: pptx_pipeline.py::_presentation_ir_with_legacy_layout_dirty
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import copy

def _presentation_ir_with_legacy_layout_dirty(
    presentation_ir: dict[str, Any],
) -> dict[str, Any]:
    """Read the retired ``layout_dirty`` key without ever writing it back."""

    def has_legacy(value: Any) -> bool:
        if isinstance(value, dict):
            if "paragraphs" in value and "layout_dirty" in value:
                return True
            return any(has_legacy(item) for item in value.values())
        if isinstance(value, list):
            return any(has_legacy(item) for item in value)
        return False

    if not has_legacy(presentation_ir):
        return presentation_ir
    upgraded = copy.deepcopy(presentation_ir)

    def upgrade(value: Any) -> None:
        if isinstance(value, dict):
            if "paragraphs" in value and "layout_dirty" in value:
                if value.pop("layout_dirty") is True:
                    value["layout_snapshot_dirty"] = True
            for item in value.values():
                upgrade(item)
        elif isinstance(value, list):
            for item in value:
                upgrade(item)

    upgrade(upgraded)
    return upgraded

_presentation_ir_with_legacy_layout_dirty.__module__ = 'pptx_pipeline'
