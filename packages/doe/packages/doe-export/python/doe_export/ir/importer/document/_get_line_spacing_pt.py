# Origin: pptx2html/ir/builder.py::PresentationBuilder._get_line_spacing_pt
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

def _get_line_spacing_pt(self, p_elem: ET.Element) -> Optional[float]:
    spc = self._find_line_spacing(p_elem)
    if spc is None:
        return None
    spc_pts = spc.find(f"{{{NAMESPACE.DML_MAIN}}}spcPts")
    if spc_pts is None:
        return None
    return self._centipoints_to_pt(spc_pts.get("val"))

_get_line_spacing_pt.__module__ = 'pptx2html.ir.builder'
_get_line_spacing_pt.__qualname__ = 'PresentationBuilder._get_line_spacing_pt'
