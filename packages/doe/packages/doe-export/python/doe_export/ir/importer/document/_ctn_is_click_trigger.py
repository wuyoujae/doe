# Origin: pptx2html/ir/builder.py::PresentationBuilder._ctn_is_click_trigger
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

@staticmethod
def _ctn_is_click_trigger(c_tn: Optional[ET.Element]) -> bool:
    if c_tn is None:
        return False
    if c_tn.get("nodeType") == "clickEffect":
        return True
    _P = NAMESPACE.PML_MAIN
    return any(
        cond.get("evt") == "onClick"
        for cond in c_tn.findall(f"{{{_P}}}stCondLst/{{{_P}}}cond")
    )

_ctn_is_click_trigger.__func__.__module__ = 'pptx2html.ir.builder'
_ctn_is_click_trigger.__func__.__qualname__ = 'PresentationBuilder._ctn_is_click_trigger'
