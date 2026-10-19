# Origin: schema_v4_math.py::_append_converted
from __future__ import annotations
from .shared import etree

def _append_converted(target: etree._Element, node: etree._Element) -> None:
    from ._fallback_mathml_node import _fallback_mathml_node
    for item in _fallback_mathml_node(node):
        target.append(item)

_append_converted.__module__ = 'schema_v4_math'
