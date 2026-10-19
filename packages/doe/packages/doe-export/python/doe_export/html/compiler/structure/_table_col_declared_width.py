# Origin: pptx2html/htmlir/compiler.py::_table_col_declared_width
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_length_or_percent_pt import _css_length_or_percent_pt
from doe_export.html.compiler.css._style_attr_property import _style_attr_property

def _table_col_declared_width(col_node: dict[str, Any], table_width: float, sx: float) -> tuple[float | None, str | None]:
    attrs = col_node.get("attributes") if isinstance(col_node.get("attributes"), dict) else {}
    computed = _computed(col_node)
    candidates = [
        ("computed", computed.get("width")),
        ("attr", attrs.get("width") if isinstance(attrs, dict) else None),
        ("style-attr", _style_attr_property(attrs.get("style"), "width") if isinstance(attrs, dict) else None),
    ]
    for source, candidate in candidates:
        width = _css_length_or_percent_pt(candidate, table_width, sx)
        if width is not None and width > 0:
            return width, source
    return None, None

_table_col_declared_width.__module__ = 'pptx2html.htmlir.compiler'
