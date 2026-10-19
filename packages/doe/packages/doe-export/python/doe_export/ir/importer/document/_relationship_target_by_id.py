# Origin: pptx2html/ir/builder.py::PresentationBuilder._relationship_target_by_id
from __future__ import annotations
from doe_export.ir.importer.shared import Optional

@classmethod
def _relationship_target_by_id(cls, owner: object | None, r_id: Optional[str]) -> Optional[str]:
    rel = cls._relationship_by_id(owner, r_id)
    if rel is None:
        return None
    return getattr(rel, "target", None)

_relationship_target_by_id.__func__.__module__ = 'pptx2html.ir.builder'
_relationship_target_by_id.__func__.__qualname__ = 'PresentationBuilder._relationship_target_by_id'
