# Origin: pptx2html/server/pptx_writer.py::_append_srgb
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement
from doe_export.pptx.writer.xml._alpha_to_ooxml import _alpha_to_ooxml

def _append_srgb(parent, color: str, alpha: Any = None) -> None:
    srgb = OxmlElement("a:srgbClr")
    srgb.set("val", color)
    alpha_value = _alpha_to_ooxml(alpha)
    if alpha_value is not None and alpha_value < 100000:
        alpha_node = OxmlElement("a:alpha")
        alpha_node.set("val", str(alpha_value))
        srgb.append(alpha_node)
    parent.append(srgb)

_append_srgb.__module__ = 'pptx2html.server.pptx_writer'
