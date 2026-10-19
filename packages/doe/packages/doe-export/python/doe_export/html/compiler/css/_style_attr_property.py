# Origin: pptx2html/htmlir/compiler.py::_style_attr_property
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re

def _style_attr_property(style: Any, property_name: str) -> str | None:
    if not isinstance(style, str) or not style:
        return None
    pattern = re.compile(rf"(?:^|;)\s*{re.escape(property_name)}\s*:\s*([^;]+)", re.IGNORECASE)
    match = pattern.search(style)
    return match.group(1).strip() if match else None

_style_attr_property.__module__ = 'pptx2html.htmlir.compiler'
