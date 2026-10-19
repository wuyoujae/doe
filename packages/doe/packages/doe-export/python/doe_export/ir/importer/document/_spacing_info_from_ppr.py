# Origin: pptx2html/ir/builder.py::PresentationBuilder._spacing_info_from_ppr
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, percentage_to_float

def _spacing_info_from_ppr(self, p_pr: ET.Element, kind: str) -> dict:
    """Get paragraph spacing from ``a:pPr`` preserving unit semantics."""
    _A = NAMESPACE.DML_MAIN
    suffix = "Bef" if kind == "before" else "Aft"
    spc = p_pr.find(f"{{{_A}}}spc{suffix}")
    if spc is None:
        return {}
    spc_pts = spc.find(f"{{{_A}}}spcPts")
    if spc_pts is not None:
        return {
            "type": "points",
            "points": self._centipoints_to_pt(spc_pts.get("val")),
        }
    spc_pct = spc.find(f"{{{_A}}}spcPct")
    if spc_pct is not None:
        return {
            "type": "percent",
            "percent": percentage_to_float(spc_pct.get("val")),
        }
    return {}

_spacing_info_from_ppr.__module__ = 'pptx2html.ir.builder'
_spacing_info_from_ppr.__qualname__ = 'PresentationBuilder._spacing_info_from_ppr'
