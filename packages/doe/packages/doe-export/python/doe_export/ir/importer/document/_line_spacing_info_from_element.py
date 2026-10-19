# Origin: pptx2html/ir/builder.py::PresentationBuilder._line_spacing_info_from_element
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, percentage_to_float

def _line_spacing_info_from_element(self, spc: ET.Element) -> dict:
    _A = NAMESPACE.DML_MAIN
    spc_pct = spc.find(f"{{{_A}}}spcPct")
    if spc_pct is not None:
        return {
            "line_spacing_type": "percent",
            "line_spacing_multiple": percentage_to_float(spc_pct.get("val")),
        }
    spc_pts = spc.find(f"{{{_A}}}spcPts")
    if spc_pts is not None:
        return {
            "line_spacing_type": "points",
            "line_spacing_pt": self._centipoints_to_pt(spc_pts.get("val")),
        }
    return {}

_line_spacing_info_from_element.__module__ = 'pptx2html.ir.builder'
_line_spacing_info_from_element.__qualname__ = 'PresentationBuilder._line_spacing_info_from_element'
