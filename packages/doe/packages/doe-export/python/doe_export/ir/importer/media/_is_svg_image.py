# Origin: pptx2html/ir/builder.py::PresentationBuilder._is_svg_image
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, Path, _SVG_CONTENT_TYPES

@staticmethod
def _is_svg_image(content_type: str, membername: Optional[str] = None) -> bool:
    normalized = (content_type or "").lower()
    suffix = Path(membername or "").suffix.lower()
    return normalized in _SVG_CONTENT_TYPES or suffix == ".svg"

_is_svg_image.__func__.__module__ = 'pptx2html.ir.builder'
_is_svg_image.__func__.__qualname__ = 'PresentationBuilder._is_svg_image'
