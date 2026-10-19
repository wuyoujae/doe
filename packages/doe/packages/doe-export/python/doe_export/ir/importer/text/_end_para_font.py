# Origin: pptx2html/ir/builder.py::PresentationBuilder._end_para_font
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, ET, Font, NAMESPACE, Optional

def _end_para_font(
    self, shape: BaseShape, p_elem: ET.Element, default_font_props: dict
) -> Optional[Font]:
    end_r_pr = p_elem.find(f"{{{NAMESPACE.DML_MAIN}}}endParaRPr")
    if end_r_pr is None:
        return None
    props = dict(default_font_props)
    props.update(self._font_props_from_rpr(end_r_pr, shape))
    return self._font_from_props(props)

_end_para_font.__module__ = 'pptx2html.ir.builder'
_end_para_font.__qualname__ = 'PresentationBuilder._end_para_font'
