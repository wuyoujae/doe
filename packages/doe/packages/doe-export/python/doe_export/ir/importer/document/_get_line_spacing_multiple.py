# Origin: pptx2html/ir/builder.py::PresentationBuilder._get_line_spacing_multiple
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional, percentage_to_float

def _get_line_spacing_multiple(self, p_elem: ET.Element) -> Optional[float]:
    spc = self._find_line_spacing(p_elem)
    if spc is None:
        return None
    spc_pct = spc.find(f"{{{NAMESPACE.DML_MAIN}}}spcPct")
    if spc_pct is None:
        return None
    return percentage_to_float(spc_pct.get("val"))

_get_line_spacing_multiple.__module__ = 'pptx2html.ir.builder'
_get_line_spacing_multiple.__qualname__ = 'PresentationBuilder._get_line_spacing_multiple'
