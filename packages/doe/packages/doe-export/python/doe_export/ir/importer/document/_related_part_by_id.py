# Origin: pptx2html/ir/builder.py::PresentationBuilder._related_part_by_id
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, PackURI, TARGET_MODE

@classmethod
def _related_part_by_id(cls, owner: object | None, r_id: Optional[str]):
    if not r_id:
        return None
    part = cls._relationship_owner_part(owner)
    rel = cls._relationship_by_id(part, r_id)
    if rel is not None and getattr(rel, "target_mode", TARGET_MODE.INTERNAL) == TARGET_MODE.INTERNAL:
        package = getattr(part, "package", None) or getattr(part, "_package", None)
        pack_uri = getattr(part, "pack_uri", None) or getattr(part, "_pack_uri", None)
        if package is not None and pack_uri is not None:
            try:
                target_uri = PackURI.from_rel_ref(pack_uri.base_uri, rel.target)
                return package.part(target_uri)
            except Exception:
                pass
    if hasattr(part, "related_part"):
        try:
            return part.related_part(r_id)
        except Exception:
            return None
    return None

_related_part_by_id.__func__.__module__ = 'pptx2html.ir.builder'
_related_part_by_id.__func__.__qualname__ = 'PresentationBuilder._related_part_by_id'
