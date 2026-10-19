# Origin: pptx2html/ir/builder.py::PresentationBuilder._find_line_spacing
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

@staticmethod
def _find_line_spacing(p_elem: ET.Element) -> Optional[ET.Element]:
    _A = NAMESPACE.DML_MAIN
    p_pr = p_elem.find(f"{{{_A}}}pPr")
    if p_pr is None:
        return None
    ln_spc = p_pr.find(f"{{{_A}}}lnSpc")
    return ln_spc

_find_line_spacing.__func__.__module__ = 'pptx2html.ir.builder'
_find_line_spacing.__func__.__qualname__ = 'PresentationBuilder._find_line_spacing'
