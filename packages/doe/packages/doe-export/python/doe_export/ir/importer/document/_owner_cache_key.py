# Origin: pptx2html/ir/builder.py::PresentationBuilder._owner_cache_key
from __future__ import annotations

@classmethod
def _owner_cache_key(cls, owner: object | None) -> object | None:
    part = cls._relationship_owner_part(owner)
    if part is None:
        return None
    pack_uri = getattr(part, "pack_uri", None) or getattr(part, "_pack_uri", None)
    membername = getattr(pack_uri, "membername", None)
    return membername or id(part)

_owner_cache_key.__func__.__module__ = 'pptx2html.ir.builder'
_owner_cache_key.__func__.__qualname__ = 'PresentationBuilder._owner_cache_key'
