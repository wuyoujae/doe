# Origin: pptx2html/ir/builder.py::PresentationBuilder._font_props_from_text_defaults
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

def _font_props_from_text_defaults(
    self, tf_elem: ET.Element, p_elem: Optional[ET.Element], level: int
) -> dict:
    props = {}
    lst_style = tf_elem.find(f"{{{NAMESPACE.DML_MAIN}}}lstStyle")
    if lst_style is not None:
        props.update(self._font_props_from_level_style(lst_style, level))

    p_pr = p_elem.find(f"{{{NAMESPACE.DML_MAIN}}}pPr") if p_elem is not None else None
    if p_pr is not None:
        props.update(
            self._font_props_from_rpr(
                p_pr.find(f"{{{NAMESPACE.DML_MAIN}}}defRPr")
            )
        )

    return props

_font_props_from_text_defaults.__module__ = 'pptx2html.ir.builder'
_font_props_from_text_defaults.__qualname__ = 'PresentationBuilder._font_props_from_text_defaults'
