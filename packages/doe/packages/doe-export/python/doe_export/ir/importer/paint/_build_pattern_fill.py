# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_pattern_fill
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Fill, NAMESPACE

def _build_pattern_fill(self, fill_elem: ET.Element) -> Fill:
    _A = NAMESPACE.DML_MAIN
    fg_color = None
    bg_color = None
    fg = fill_elem.find(f"{{{_A}}}fgClr")
    bg = fill_elem.find(f"{{{_A}}}bgClr")
    if fg is not None:
        fg_color, _ = self._color_from_fill_elem(fg)
    if bg is not None:
        bg_color, _ = self._color_from_fill_elem(bg)
    return Fill(
        type="pattern",
        pattern_preset=fill_elem.get("prst"),
        pattern_fg_color=fg_color,
        pattern_bg_color=bg_color,
    )

_build_pattern_fill.__module__ = 'pptx2html.ir.builder'
_build_pattern_fill.__qualname__ = 'PresentationBuilder._build_pattern_fill'
