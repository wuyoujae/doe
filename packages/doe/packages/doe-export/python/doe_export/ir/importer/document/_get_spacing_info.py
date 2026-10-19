# Origin: pptx2html/ir/builder.py::PresentationBuilder._get_spacing_info
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE

def _get_spacing_info(self, p_elem: ET.Element, kind: str) -> dict:
    """Get paragraph spacing while preserving DrawingML unit semantics."""
    _A = NAMESPACE.DML_MAIN
    p_pr = p_elem.find(f"{{{_A}}}pPr")
    if p_pr is None:
        return {}
    return self._spacing_info_from_ppr(p_pr, kind)

_get_spacing_info.__module__ = 'pptx2html.ir.builder'
_get_spacing_info.__qualname__ = 'PresentationBuilder._get_spacing_info'
