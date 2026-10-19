# Origin: schema_v4_export.py::_merge_presentations
from __future__ import annotations
from .shared import Any, SchemaV4ExportError, json

def _merge_presentations(
    compiled_presentations: list[dict[str, Any]],
    *,
    title: str,
) -> dict[str, Any]:
    if not compiled_presentations:
        raise SchemaV4ExportError("Schema v4 export produced no compiled slides.")
    first = json.loads(json.dumps(compiled_presentations[0]))
    slides: list[dict[str, Any]] = []
    for index, presentation in enumerate(compiled_presentations):
        current = presentation.get("slides")
        if not isinstance(current, list) or len(current) != 1 or not isinstance(current[0], dict):
            raise SchemaV4ExportError(
                f"Schema v4 slide {index + 1} did not compile to exactly one IR slide."
            )
        slides.append(current[0])
    first["slides"] = slides
    if title.strip():
        first["name"] = title.strip()
    return first

_merge_presentations.__module__ = 'schema_v4_export'
