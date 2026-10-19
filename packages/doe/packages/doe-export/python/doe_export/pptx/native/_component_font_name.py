# Origin: schema_v4_native.py::_component_font_name
from __future__ import annotations
from .shared import Any
from ._contains_han_text import _contains_han_text

def _component_font_name(component: dict[str, Any]) -> str:
    return "MiSans" if _contains_han_text(component) else "Alexandria"

_component_font_name.__module__ = 'schema_v4_native'
