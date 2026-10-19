# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_solid_fill
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Fill, NAMESPACE, Optional

def _build_solid_fill(self, fill_elem: ET.Element) -> Optional[Fill]:
    _A = NAMESPACE.DML_MAIN
    color, alpha = self._color_from_fill_elem(fill_elem)
    if color:
        return Fill(type="solid", color=color, alpha=alpha)

    return None

_build_solid_fill.__module__ = 'pptx2html.ir.builder'
_build_solid_fill.__qualname__ = 'PresentationBuilder._build_solid_fill'
