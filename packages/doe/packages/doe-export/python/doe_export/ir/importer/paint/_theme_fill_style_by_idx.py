# Origin: pptx2html/ir/builder.py::PresentationBuilder._theme_fill_style_by_idx
from __future__ import annotations
from doe_export.ir.importer.shared import Fill, Optional

def _theme_fill_style_by_idx(self, raw_idx: Optional[str]) -> Optional[Fill]:
    try:
        idx = int(raw_idx or "0")
    except ValueError:
        return None
    if idx >= 1001:
        bg_index = idx - 1001
        if 0 <= bg_index < len(self._theme_bg_fill_styles):
            return self._theme_bg_fill_styles[bg_index]
        return None
    return self._theme_style_by_idx(self._theme_fill_styles, raw_idx)

_theme_fill_style_by_idx.__module__ = 'pptx2html.ir.builder'
_theme_fill_style_by_idx.__qualname__ = 'PresentationBuilder._theme_fill_style_by_idx'
