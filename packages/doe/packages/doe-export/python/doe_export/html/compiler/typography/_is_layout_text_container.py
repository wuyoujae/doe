# Origin: pptx2html/htmlir/compiler.py::_is_layout_text_container
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.document._is_flex_display import _is_flex_display
from doe_export.html.compiler.document._is_grid_display import _is_grid_display

def _is_layout_text_container(computed: dict[str, Any]) -> bool:
    return _is_flex_display(computed) or _is_grid_display(computed)

_is_layout_text_container.__module__ = 'pptx2html.htmlir.compiler'
