# Origin: pptx2html/ir/builder.py::PresentationBuilder._parse_theme_three_d_styles
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional, ThreeDInfo

def _parse_theme_three_d_styles(self, theme_elem: ET.Element) -> list[Optional[ThreeDInfo]]:
    _A = NAMESPACE.DML_MAIN
    fmt_scheme = theme_elem.find(f".//{{{_A}}}fmtScheme")
    if fmt_scheme is None:
        return []
    effect_style_list = fmt_scheme.find(f"{{{_A}}}effectStyleLst")
    if effect_style_list is None:
        return []
    return [
        self._parse_three_d(effect_style)
        for effect_style in effect_style_list.findall(f"{{{_A}}}effectStyle")
    ]

_parse_theme_three_d_styles.__module__ = 'pptx2html.ir.builder'
_parse_theme_three_d_styles.__qualname__ = 'PresentationBuilder._parse_theme_three_d_styles'
