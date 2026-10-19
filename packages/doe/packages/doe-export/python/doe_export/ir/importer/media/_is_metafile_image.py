# Origin: pptx2html/ir/builder.py::PresentationBuilder._is_metafile_image
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, Path, _METAFILE_CONTENT_TYPES, _METAFILE_EXTENSIONS

@staticmethod
def _is_metafile_image(content_type: str, membername: Optional[str] = None) -> bool:
    normalized = (content_type or "").lower()
    suffix = Path(membername or "").suffix.lower()
    return normalized in _METAFILE_CONTENT_TYPES or suffix in _METAFILE_EXTENSIONS

_is_metafile_image.__func__.__module__ = 'pptx2html.ir.builder'
_is_metafile_image.__func__.__qualname__ = 'PresentationBuilder._is_metafile_image'
