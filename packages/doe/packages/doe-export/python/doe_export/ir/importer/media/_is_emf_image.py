# Origin: pptx2html/ir/builder.py::PresentationBuilder._is_emf_image
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, Path, _EMF_CONTENT_TYPES, _METAFILE_EXTENSIONS

@staticmethod
def _is_emf_image(content_type: str, membername: Optional[str] = None) -> bool:
    suffix = Path(membername or "").suffix.lower()
    if suffix in _METAFILE_EXTENSIONS:
        return suffix == ".emf"
    return (content_type or "").lower() in _EMF_CONTENT_TYPES

_is_emf_image.__func__.__module__ = 'pptx2html.ir.builder'
_is_emf_image.__func__.__qualname__ = 'PresentationBuilder._is_emf_image'
