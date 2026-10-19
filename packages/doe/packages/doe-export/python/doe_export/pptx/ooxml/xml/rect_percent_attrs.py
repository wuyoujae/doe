# Origin: pptx2html/server/ooxml_pptx_writer.py::rect_percent_attrs
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.xml.percent_attr import percent_attr
from doe_export.pptx.ooxml.xml.signed_percent_attr import signed_percent_attr

def rect_percent_attrs(
    source: dict[str, Any],
    mapping: dict[str, str],
    *,
    signed: bool = False,
) -> dict[str, str]:
    attrs: dict[str, str] = {}
    for key, attr in mapping.items():
        if source.get(key) is not None:
            attrs[attr] = signed_percent_attr(source.get(key)) if signed else percent_attr(source.get(key))
    return attrs

rect_percent_attrs.__module__ = 'pptx2html.server.ooxml_pptx_writer'
