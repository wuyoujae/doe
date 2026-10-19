# Origin: schema_v4_fonts.py::_read_cached_font_part
from __future__ import annotations
from .shared import MAX_FONT_SUBSET_BYTES, _FONT_CACHE_LOCK, struct
from ._font_cache_root import _font_cache_root

def _read_cached_font_part(cache_key: str) -> bytes | None:
    path = _font_cache_root() / f"{cache_key}.fntdata"
    with _FONT_CACHE_LOCK:
        try:
            payload = path.read_bytes()
        except OSError:
            return None
    if len(payload) < 12 or len(payload) > MAX_FONT_SUBSET_BYTES:
        return None
    try:
        declared_total, declared_sfnt, version = struct.unpack_from("<III", payload, 0)
    except struct.error:
        return None
    if declared_total != len(payload) or declared_sfnt <= 0 or version != 0x00020002:
        return None
    return payload

_read_cached_font_part.__module__ = 'schema_v4_fonts'
