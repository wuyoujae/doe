# Origin: pptx2html/ir/builder.py::PresentationBuilder._parse_theme_colors
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, local_name, normalize_hex_color

@staticmethod
def _parse_theme_colors(theme_elem: ET.Element) -> dict[str, str]:
    _A = NAMESPACE.DML_MAIN
    clr_scheme = theme_elem.find(f".//{{{_A}}}clrScheme")
    if clr_scheme is None:
        return {}

    colors: dict[str, str] = {}
    for color_slot in clr_scheme:
        slot_name = local_name(color_slot.tag).lower()
        srgb = color_slot.find(f"{{{_A}}}srgbClr")
        if srgb is not None:
            color = normalize_hex_color(srgb.get("val"))
            if color:
                colors[slot_name] = color
            continue
        sys_clr = color_slot.find(f"{{{_A}}}sysClr")
        if sys_clr is not None:
            color = normalize_hex_color(sys_clr.get("lastClr"))
            if color:
                colors[slot_name] = color
    return colors

_parse_theme_colors.__func__.__module__ = 'pptx2html.ir.builder'
_parse_theme_colors.__func__.__qualname__ = 'PresentationBuilder._parse_theme_colors'
