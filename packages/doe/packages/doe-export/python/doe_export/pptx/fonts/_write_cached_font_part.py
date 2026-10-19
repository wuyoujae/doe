# Origin: schema_v4_fonts.py::_write_cached_font_part
from __future__ import annotations
from .shared import Path, _FONT_CACHE_LOCK, os, tempfile
from ._font_cache_root import _font_cache_root

def _write_cached_font_part(cache_key: str, payload: bytes) -> None:
    root = _font_cache_root()
    target = root / f"{cache_key}.fntdata"
    with _FONT_CACHE_LOCK:
        if target.is_file():
            return
        descriptor, temporary_name = tempfile.mkstemp(
            prefix=f".{cache_key}.",
            suffix=".tmp",
            dir=root,
        )
        try:
            with os.fdopen(descriptor, "wb") as stream:
                stream.write(payload)
                stream.flush()
                os.fsync(stream.fileno())
            os.replace(temporary_name, target)
        finally:
            try:
                Path(temporary_name).unlink(missing_ok=True)
            except OSError:
                pass

_write_cached_font_part.__module__ = 'schema_v4_fonts'
