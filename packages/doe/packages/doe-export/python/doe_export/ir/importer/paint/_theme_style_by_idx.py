# Origin: pptx2html/ir/builder.py::PresentationBuilder._theme_style_by_idx
from __future__ import annotations
from doe_export.ir.importer.shared import Optional

@staticmethod
def _theme_style_by_idx(styles: list, raw_idx: Optional[str]):
    try:
        idx = int(raw_idx or "0")
    except ValueError:
        return None
    if idx <= 0:
        return None
    style_index = idx - 1
    if 0 <= style_index < len(styles):
        return styles[style_index]
    return None

_theme_style_by_idx.__func__.__module__ = 'pptx2html.ir.builder'
_theme_style_by_idx.__func__.__qualname__ = 'PresentationBuilder._theme_style_by_idx'
