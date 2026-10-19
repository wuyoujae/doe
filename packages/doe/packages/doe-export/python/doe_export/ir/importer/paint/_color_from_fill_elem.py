# Origin: pptx2html/ir/builder.py::PresentationBuilder._color_from_fill_elem
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

def _color_from_fill_elem(self, elem: ET.Element) -> tuple[Optional[str], Optional[float]]:
    _A = NAMESPACE.DML_MAIN
    for tag, attr in (("srgbClr", "val"), ("schemeClr", "val"), ("sysClr", "lastClr"), ("prstClr", "val")):
        color_elem = elem.find(f"{{{_A}}}{tag}")
        if color_elem is None:
            continue
        color = self._resolve_color(color_elem.get(attr))
        color = self._apply_color_transforms(color, color_elem)
        alpha = self._alpha_from_color_transforms(color_elem)
        return color, alpha
    gradient_fill = elem.find(f"{{{_A}}}gradFill")
    if gradient_fill is not None:
        for stop in gradient_fill.findall(f"{{{_A}}}gsLst/{{{_A}}}gs"):
            color, alpha = self._color_from_fill_elem(stop)
            if color:
                return color, alpha
    return None, None

_color_from_fill_elem.__module__ = 'pptx2html.ir.builder'
_color_from_fill_elem.__qualname__ = 'PresentationBuilder._color_from_fill_elem'
