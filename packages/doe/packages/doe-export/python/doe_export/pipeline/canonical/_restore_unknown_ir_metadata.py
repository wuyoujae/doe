# Origin: pptx_pipeline.py::_restore_unknown_ir_metadata
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import copy

def _restore_unknown_ir_metadata(
    source: Any,
    rendered: Any,
) -> Any:
    """Restore forward-compatible metadata omitted by the typed serializer."""

    restored = copy.deepcopy(rendered)

    def visit(old: Any, new: Any) -> None:
        if isinstance(old, dict) and isinstance(new, dict):
            for key, old_value in old.items():
                if key not in new:
                    new[key] = copy.deepcopy(old_value)
                else:
                    visit(old_value, new[key])
        elif isinstance(old, list) and isinstance(new, list):
            for old_item, new_item in zip(old, new):
                visit(old_item, new_item)

    visit(source, restored)
    return restored

_restore_unknown_ir_metadata.__module__ = 'pptx_pipeline'
