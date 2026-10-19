# Origin: schema_v4_fonts.py::_font_cache_root
from __future__ import annotations
from .shared import Path, os, tempfile

def _font_cache_root() -> Path:
    configured = os.environ.get("YRKIE_SCHEMA_FONT_CACHE_DIR", "").strip()
    root = (
        Path(configured).expanduser()
        if configured
        else Path(tempfile.gettempdir()) / "yrkie-schema-v4-fonts-v1"
    )
    root.mkdir(parents=True, exist_ok=True)
    return root.resolve()

_font_cache_root.__module__ = 'schema_v4_fonts'
