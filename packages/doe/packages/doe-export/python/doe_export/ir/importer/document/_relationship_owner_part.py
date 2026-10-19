# Origin: pptx2html/ir/builder.py::PresentationBuilder._relationship_owner_part
from __future__ import annotations

@staticmethod
def _relationship_owner_part(owner: object | None):
    if owner is None:
        return None
    return (
        getattr(owner, "part", None)
        or getattr(owner, "_part", None)
        or owner
    )

_relationship_owner_part.__func__.__module__ = 'pptx2html.ir.builder'
_relationship_owner_part.__func__.__qualname__ = 'PresentationBuilder._relationship_owner_part'
