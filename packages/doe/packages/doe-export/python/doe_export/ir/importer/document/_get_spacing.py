# Origin: pptx2html/ir/builder.py::PresentationBuilder._get_spacing
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

@staticmethod
def _get_spacing(p_elem: ET.Element, kind: str) -> Optional[float]:
    """Get paragraph spacing in points."""
    _A = NAMESPACE.DML_MAIN
    pPr = p_elem.find(f"{{{_A}}}pPr")
    if pPr is None:
        return None
    suffix = "Bef" if kind == "before" else "Aft"
    tag = f"{{{_A}}}spc{suffix}"
    spc = pPr.find(tag)
    if spc is None:
        return None
    spc_pts = spc.find(f"{{{_A}}}spcPts")
    if spc_pts is not None:
        val = spc_pts.get("val")
        if val is not None:
            try:
                return int(val) / 100.0
                # ^ stored in hundredths of a point
            except (ValueError, TypeError):
                pass
    spc_pct = spc.find(f"{{{_A}}}spcPct")
    return None  # FIXME: percentage-based spacing

_get_spacing.__func__.__module__ = 'pptx2html.ir.builder'
_get_spacing.__func__.__qualname__ = 'PresentationBuilder._get_spacing'
