# Origin: pptx2html/server/pptx_writer.py::_append_blip_alpha
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement
from doe_export.pptx.writer.xml._alpha_to_ooxml import _alpha_to_ooxml
from doe_export.pptx.writer.xml._remove_children import _remove_children

def _append_blip_alpha(blip, alpha: Any) -> None:
    _remove_children(blip, ("a:alphaModFix",))
    alpha_value = _alpha_to_ooxml(alpha)
    if alpha_value is None or alpha_value >= 100000:
        return
    alpha_node = OxmlElement("a:alphaModFix")
    alpha_node.set("amt", str(alpha_value))
    blip.append(alpha_node)

_append_blip_alpha.__module__ = 'pptx2html.server.pptx_writer'
