# Origin: pptx2html/ir/builder.py::PresentationBuilder._color_from_solid_fill
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

def _color_from_solid_fill(self, fill_elem: ET.Element) -> Optional[str]:
    _A = NAMESPACE.DML_MAIN
    srgb = fill_elem.find(f"{{{_A}}}srgbClr")
    if srgb is not None:
        return self._resolve_color(srgb.get("val"))
    scheme = fill_elem.find(f"{{{_A}}}schemeClr")
    if scheme is not None:
        return self._resolve_color(scheme.get("val"))
    return None

_color_from_solid_fill.__module__ = 'pptx2html.ir.builder'
_color_from_solid_fill.__qualname__ = 'PresentationBuilder._color_from_solid_fill'
