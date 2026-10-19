# Origin: schema_v4_native.py::_component_semibold_font_name
from __future__ import annotations
from .shared import Any
from ._component_font_name import _component_font_name

def _component_semibold_font_name(component: dict[str, Any]) -> str:
    return f"{_component_font_name(component)} Medium"

_component_semibold_font_name.__module__ = 'schema_v4_native'
