# Origin: schema_v4_fonts.py::_relationship_target_part
from __future__ import annotations
from .shared import posixpath

def _relationship_target_part(target: str | None) -> str | None:
    if not target:
        return None
    normalized = posixpath.normpath(posixpath.join("ppt", target.replace("\\", "/")))
    if normalized.startswith("../") or normalized.startswith("/"):
        return None
    return normalized

_relationship_target_part.__module__ = 'schema_v4_fonts'
