# Origin: pptx2html/ir/builder.py::PresentationBuilder._paragraph_props_from_text_style
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE

def _paragraph_props_from_text_style(
    self, style_elem: ET.Element, level: int
) -> dict:
    _A = NAMESPACE.DML_MAIN
    props: dict = {}
    def_p_pr = style_elem.find(f"{{{_A}}}defPPr")
    props.update(self._paragraph_props_from_ppr(def_p_pr))

    lvl_tag = f"{{{_A}}}lvl{min(max(level, 0), 8) + 1}pPr"
    lvl_p_pr = style_elem.find(lvl_tag)
    props.update(self._paragraph_props_from_ppr(lvl_p_pr))
    return props

_paragraph_props_from_text_style.__module__ = 'pptx2html.ir.builder'
_paragraph_props_from_text_style.__qualname__ = 'PresentationBuilder._paragraph_props_from_text_style'
