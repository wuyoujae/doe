# Origin: pptx2html/ir/builder.py::PresentationBuilder._find_background_fill_container
from __future__ import annotations
from doe_export.ir.importer.shared import BaseSlidePart, ET, NAMESPACE, Optional

@staticmethod
def _find_background_fill_container(part: BaseSlidePart) -> Optional[ET.Element]:
    p_ns = NAMESPACE.PML_MAIN
    c_sld = part.element.find(f"{{{p_ns}}}cSld")
    if c_sld is None:
        return None
    bg_elem = c_sld.find(f"{{{p_ns}}}bg")
    if bg_elem is None:
        return None
    bg_pr = bg_elem.find(f"{{{p_ns}}}bgPr")
    return bg_pr if bg_pr is not None else bg_elem

_find_background_fill_container.__func__.__module__ = 'pptx2html.ir.builder'
_find_background_fill_container.__func__.__qualname__ = 'PresentationBuilder._find_background_fill_container'
