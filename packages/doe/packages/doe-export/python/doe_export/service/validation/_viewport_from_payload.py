# Origin: htmlir_server.py::_viewport_from_payload
from __future__ import annotations
from doe_export.service.shared import Any, MAX_VIEWPORT_DIMENSION

def _viewport_from_payload(payload: dict[str, Any]) -> tuple[int, int]:
    viewport = payload.get("viewport")
    if isinstance(viewport, dict):
        width, height = int(viewport.get("width") or 1280), int(viewport.get("height") or 720)
    elif isinstance(viewport, (list, tuple)) and len(viewport) >= 2:
        width, height = int(viewport[0]), int(viewport[1])
    else:
        width, height = 1280, 720
    if not 1 <= width <= MAX_VIEWPORT_DIMENSION or not 1 <= height <= MAX_VIEWPORT_DIMENSION:
        raise ValueError(
            f"viewport dimensions must be between 1 and {MAX_VIEWPORT_DIMENSION}."
        )
    return width, height

_viewport_from_payload.__module__ = 'htmlir_server'
