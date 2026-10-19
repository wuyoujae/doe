# Origin: pptx2html/ir/builder.py::PresentationBuilder._relationship_by_id
from __future__ import annotations
from doe_export.ir.importer.shared import Optional

@classmethod
def _relationship_by_id(cls, owner: object | None, r_id: Optional[str]):
    if not r_id:
        return None
    part = cls._relationship_owner_part(owner)
    relationships = getattr(part, "relationships", None)
    if relationships is None:
        return None
    try:
        return relationships[r_id]
    except Exception:
        return None

_relationship_by_id.__func__.__module__ = 'pptx2html.ir.builder'
_relationship_by_id.__func__.__qualname__ = 'PresentationBuilder._relationship_by_id'
