# Origin: pptx2html/server/ooxml_pptx_writer.py::write_blip_alpha
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.append_blip_effect_child import append_blip_effect_child
from doe_export.pptx.ooxml.xml.percent_attr import percent_attr
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.remove_children import remove_children
from doe_export.pptx.ooxml.xml.safe_float import safe_float

def write_blip_alpha(blip: ET.Element, alpha: Any) -> None:
    remove_children(blip, {qn(A, "alphaModFix")})
    if alpha is not None and safe_float(alpha, 1.0) < 1:
        append_blip_effect_child(
            blip,
            ET.Element(qn(A, "alphaModFix"), {"amt": percent_attr(alpha)}),
        )

write_blip_alpha.__module__ = 'pptx2html.server.ooxml_pptx_writer'
