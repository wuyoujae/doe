# Origin: pptx2html/ir/builder.py::PresentationBuilder._get_line_spacing_info
from __future__ import annotations
from doe_export.ir.importer.shared import ET

def _get_line_spacing_info(self, p_elem: ET.Element) -> dict:
    spc = self._find_line_spacing(p_elem)
    if spc is None:
        return {}
    return self._line_spacing_info_from_element(spc)

_get_line_spacing_info.__module__ = 'pptx2html.ir.builder'
_get_line_spacing_info.__qualname__ = 'PresentationBuilder._get_line_spacing_info'
