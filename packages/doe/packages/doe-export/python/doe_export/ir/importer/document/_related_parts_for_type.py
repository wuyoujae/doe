# Origin: pptx2html/ir/builder.py::PresentationBuilder._related_parts_for_type
from __future__ import annotations

@staticmethod
def _related_parts_for_type(owner: object | None, rel_type: str) -> list[object]:
    if owner is None:
        return []
    related_parts = getattr(owner, "related_parts", None)
    if not callable(related_parts):
        return []
    try:
        return list(related_parts(rel_type))
    except Exception:
        return []

_related_parts_for_type.__func__.__module__ = 'pptx2html.ir.builder'
_related_parts_for_type.__func__.__qualname__ = 'PresentationBuilder._related_parts_for_type'
