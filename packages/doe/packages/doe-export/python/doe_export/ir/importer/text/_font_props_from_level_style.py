# Origin: pptx2html/ir/builder.py::PresentationBuilder._font_props_from_level_style
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE

def _font_props_from_level_style(self, style_elem: ET.Element, level: int) -> dict:
    props = {}
    def_p_pr = style_elem.find(f"{{{NAMESPACE.DML_MAIN}}}defPPr")
    if def_p_pr is not None:
        props.update(
            self._font_props_from_rpr(
                def_p_pr.find(f"{{{NAMESPACE.DML_MAIN}}}defRPr")
            )
        )

    lvl_tag = f"{{{NAMESPACE.DML_MAIN}}}lvl{min(max(level, 0), 8) + 1}pPr"
    lvl_p_pr = style_elem.find(lvl_tag)
    if lvl_p_pr is None:
        return props
    props.update(
        self._font_props_from_rpr(
            lvl_p_pr.find(f"{{{NAMESPACE.DML_MAIN}}}defRPr")
        )
    )
    return props

_font_props_from_level_style.__module__ = 'pptx2html.ir.builder'
_font_props_from_level_style.__qualname__ = 'PresentationBuilder._font_props_from_level_style'
