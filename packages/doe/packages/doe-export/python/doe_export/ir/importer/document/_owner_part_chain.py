# Origin: pptx2html/ir/builder.py::PresentationBuilder._owner_part_chain
from __future__ import annotations

@classmethod
def _owner_part_chain(cls, owner: object | None) -> list[object]:
    part = cls._relationship_owner_part(owner)
    if part is None:
        return []
    chain: list[object] = []
    seen: set[int] = set()

    def append(candidate: object | None) -> None:
        if candidate is None or id(candidate) in seen:
            return
        seen.add(id(candidate))
        chain.append(candidate)

    append(part)
    layout = getattr(part, "slide_layout", None)
    append(layout)
    master = getattr(layout, "slide_master", None) if layout is not None else None
    if master is None:
        master = getattr(part, "slide_master", None)
    append(master)
    return chain

_owner_part_chain.__func__.__module__ = 'pptx2html.ir.builder'
_owner_part_chain.__func__.__qualname__ = 'PresentationBuilder._owner_part_chain'
