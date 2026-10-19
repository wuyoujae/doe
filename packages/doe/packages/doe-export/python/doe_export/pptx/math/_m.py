# Origin: schema_v4_math.py::_m
from __future__ import annotations
from .shared import MATH_NS, etree

def _m(tag: str, **attrs: str) -> etree._Element:
    element = etree.Element(f"{{{MATH_NS}}}{tag}")
    for name, value in attrs.items():
        element.set(f"{{{MATH_NS}}}{name}", value)
    return element

_m.__module__ = 'schema_v4_math'
