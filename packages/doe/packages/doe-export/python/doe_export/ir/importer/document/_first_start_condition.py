# Origin: pptx2html/ir/builder.py::PresentationBuilder._first_start_condition
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

@staticmethod
def _first_start_condition(c_tn: Optional[ET.Element]) -> Optional[ET.Element]:
    if c_tn is None:
        return None
    _P = NAMESPACE.PML_MAIN
    conds = c_tn.findall(f"{{{_P}}}stCondLst/{{{_P}}}cond")
    if not conds:
        return None
    for cond in conds:
        delay = cond.get("delay")
        if delay not in {None, "", "indefinite"} or cond.get("evt"):
            return cond
    return conds[0]

_first_start_condition.__func__.__module__ = 'pptx2html.ir.builder'
_first_start_condition.__func__.__qualname__ = 'PresentationBuilder._first_start_condition'
