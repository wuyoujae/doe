# Origin: pptx2html/server/pptx_writer.py::_merged_image_effects
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _merged_image_effects(*groups: Any) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    seen_types: set[str] = set()
    for group in groups:
        for effect in group if isinstance(group, list) else []:
            if not isinstance(effect, dict):
                continue
            effect_type = str(effect.get("type") or "").strip().lower()
            if not effect_type or effect_type in seen_types:
                continue
            seen_types.add(effect_type)
            result.append(effect)
    return result

_merged_image_effects.__module__ = 'pptx2html.server.pptx_writer'
