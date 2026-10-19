# Origin: pptx2html/ir/builder.py::PresentationBuilder._background_fill_from_ref
from __future__ import annotations
from doe_export.ir.importer.shared import BaseSlidePart, Fill, NAMESPACE, Optional

def _background_fill_from_ref(self, part: BaseSlidePart) -> Optional[Fill]:
    p_ns = NAMESPACE.PML_MAIN
    c_sld = part.element.find(f"{{{p_ns}}}cSld")
    if c_sld is None:
        return None
    bg_ref = c_sld.find(f"{{{p_ns}}}bg/{{{p_ns}}}bgRef")
    if bg_ref is None:
        return None
    return self._fill_from_theme_matrix(bg_ref.get("idx"), bg_ref)

_background_fill_from_ref.__module__ = 'pptx2html.ir.builder'
_background_fill_from_ref.__qualname__ = 'PresentationBuilder._background_fill_from_ref'
