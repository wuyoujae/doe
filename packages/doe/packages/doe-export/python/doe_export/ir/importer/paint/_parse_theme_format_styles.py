# Origin: pptx2html/ir/builder.py::PresentationBuilder._parse_theme_format_styles
from __future__ import annotations
from doe_export.ir.importer.shared import Border, ET, Fill, NAMESPACE, Shadow

def _parse_theme_format_styles(self, theme_elem: ET.Element) -> tuple[list[Fill], list[Fill], list[Border], list[Shadow]]:
    _A = NAMESPACE.DML_MAIN
    fmt_scheme = theme_elem.find(f".//{{{_A}}}fmtScheme")
    if fmt_scheme is None:
        return [], [], [], []

    fills: list[Fill] = []
    fill_style_list = fmt_scheme.find(f"{{{_A}}}fillStyleLst")
    if fill_style_list is not None:
        for child in list(fill_style_list):
            fill = self._build_fill_choice(child)
            if fill is not None:
                fills.append(fill)

    bg_fills: list[Fill] = []
    bg_fill_style_list = fmt_scheme.find(f"{{{_A}}}bgFillStyleLst")
    if bg_fill_style_list is not None:
        for child in list(bg_fill_style_list):
            fill = self._build_fill_choice(child)
            if fill is not None:
                bg_fills.append(fill)

    lines: list[Border] = []
    line_style_list = fmt_scheme.find(f"{{{_A}}}lnStyleLst")
    if line_style_list is not None:
        for child in line_style_list.findall(f"{{{_A}}}ln"):
            border = self._border_from_line(child)
            if border is not None:
                lines.append(border)

    effects: list[Shadow] = []
    effect_style_list = fmt_scheme.find(f"{{{_A}}}effectStyleLst")
    if effect_style_list is not None:
        for effect_style in effect_style_list.findall(f"{{{_A}}}effectStyle"):
            shadow = self._parse_shadow(effect_style)
            if shadow is not None:
                effects.append(shadow)

    return fills, bg_fills, lines, effects

_parse_theme_format_styles.__module__ = 'pptx2html.ir.builder'
_parse_theme_format_styles.__qualname__ = 'PresentationBuilder._parse_theme_format_styles'
