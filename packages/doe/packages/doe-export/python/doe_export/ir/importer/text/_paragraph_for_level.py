# Origin: pptx2html/ir/builder.py::PresentationBuilder._paragraph_for_level
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

@staticmethod
def _paragraph_for_level(tf_elem: ET.Element, level: int) -> Optional[ET.Element]:
    _A = NAMESPACE.DML_MAIN
    first_paragraph = None
    for p_elem in tf_elem.findall(f"{{{_A}}}p"):
        if first_paragraph is None:
            first_paragraph = p_elem

        p_pr = p_elem.find(f"{{{_A}}}pPr")
        raw_level = p_pr.get("lvl") if p_pr is not None else None
        try:
            paragraph_level = int(raw_level) if raw_level is not None else 0
        except (ValueError, TypeError):
            paragraph_level = 0
        if paragraph_level == level:
            return p_elem

    return first_paragraph

_paragraph_for_level.__func__.__module__ = 'pptx2html.ir.builder'
_paragraph_for_level.__func__.__qualname__ = 'PresentationBuilder._paragraph_for_level'
