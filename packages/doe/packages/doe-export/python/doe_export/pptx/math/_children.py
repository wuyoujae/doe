# Origin: schema_v4_math.py::_children
from __future__ import annotations
from .shared import etree

def _children(node: etree._Element) -> list[etree._Element]:
    return [child for child in node if isinstance(child.tag, str)]

_children.__module__ = 'schema_v4_math'
