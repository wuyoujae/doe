# Origin: pptx2html/ir/builder.py::PresentationBuilder._tab_stops_from_ppr
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional, TabStop, emu_to_pt

def _tab_stops_from_ppr(self, p_pr: Optional[ET.Element]) -> list[TabStop]:
    if p_pr is None:
        return []
    _A = NAMESPACE.DML_MAIN
    tab_lst = p_pr.find(f"{{{_A}}}tabLst")
    if tab_lst is None:
        return []
    stops = []
    for tab in tab_lst.findall(f"{{{_A}}}tab"):
        stops.append(
            TabStop(
                position=emu_to_pt(tab.get("pos")),
                alignment=tab.get("algn"),
            )
        )
    return stops

_tab_stops_from_ppr.__module__ = 'pptx2html.ir.builder'
_tab_stops_from_ppr.__qualname__ = 'PresentationBuilder._tab_stops_from_ppr'
