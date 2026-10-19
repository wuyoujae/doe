# Origin: pptx2html/ir/builder.py::PresentationBuilder._fill_from_theme_matrix
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Fill, Optional, copy

def _fill_from_theme_matrix(self, raw_idx: Optional[str], ref: ET.Element) -> Optional[Fill]:
    color, alpha = self._color_from_fill_elem(ref)
    style = self._theme_fill_style_by_idx(raw_idx)
    if style is not None:
        styled = copy.deepcopy(style)
        if color and styled.type in {"solid", "none"}:
            styled.type = "solid"
            styled.color = color
            styled.alpha = alpha
        elif color and styled.type == "gradient":
            for stop in styled.gradient_stops:
                if str(stop.color or "").lower() == "phclr":
                    stop.color = color
                    if stop.alpha is None:
                        stop.alpha = alpha
        elif color and not styled.color and not styled.gradient_stops:
            styled.color = color
            styled.alpha = alpha
        return styled
    return None

_fill_from_theme_matrix.__module__ = 'pptx2html.ir.builder'
_fill_from_theme_matrix.__qualname__ = 'PresentationBuilder._fill_from_theme_matrix'
