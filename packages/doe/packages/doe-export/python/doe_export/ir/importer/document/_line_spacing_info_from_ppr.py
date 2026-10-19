# Origin: pptx2html/ir/builder.py::PresentationBuilder._line_spacing_info_from_ppr
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE

def _line_spacing_info_from_ppr(self, p_pr: ET.Element) -> dict:
    spc = p_pr.find(f"{{{NAMESPACE.DML_MAIN}}}lnSpc")
    if spc is None:
        return {}
    return self._line_spacing_info_from_element(spc)

_line_spacing_info_from_ppr.__module__ = 'pptx2html.ir.builder'
_line_spacing_info_from_ppr.__qualname__ = 'PresentationBuilder._line_spacing_info_from_ppr'
