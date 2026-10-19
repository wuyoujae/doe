# Origin: schema_v4_export.py::_renderer_root
from __future__ import annotations
from .shared import Path, RUNTIME_ROOT, SchemaV4ExportError, os
from doe_export.runtime.paths import public_root

def _renderer_root() -> Path:
    configured = os.environ.get("YRKIE_SCHEMA_RENDERER_ROOT", "").strip()
    root = (
        Path(configured).expanduser()
        if configured
        else public_root() / "yrkie-doe"
    )
    try:
        resolved = root.resolve(strict=True)
    except OSError as error:
        raise SchemaV4ExportError("Schema v4 renderer root is unavailable.") from error
    if not resolved.is_dir():
        raise SchemaV4ExportError("Schema v4 renderer root is invalid.")
    return resolved

_renderer_root.__module__ = 'schema_v4_export'
