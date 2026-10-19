# Origin: htmlir_server.py::_export_embed_fonts
from __future__ import annotations
from doe_export.service.shared import Any

def _export_embed_fonts(payload: dict[str, Any]) -> bool:
    value = payload.get("embed_fonts", True)
    if not isinstance(value, bool):
        raise ValueError("Expected JSON field 'embed_fonts' as a boolean.")
    return value

_export_embed_fonts.__module__ = 'htmlir_server'
