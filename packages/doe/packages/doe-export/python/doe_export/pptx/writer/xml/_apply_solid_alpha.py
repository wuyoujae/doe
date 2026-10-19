# Origin: pptx2html/server/pptx_writer.py::_apply_solid_alpha
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement, qn
from doe_export.pptx.writer.xml._alpha_to_ooxml import _alpha_to_ooxml
from doe_export.pptx.writer.xml._remove_children import _remove_children
from doe_export.pptx.writer.shape._shape_sp_pr import _shape_sp_pr

def _apply_solid_alpha(pptx_shape, alpha: Any) -> None:
    alpha_value = _alpha_to_ooxml(alpha)
    if alpha_value is None or alpha_value >= 100000:
        return
    sp_pr = _shape_sp_pr(pptx_shape)
    solid = sp_pr.find(qn("a:solidFill"))
    srgb = solid.find(qn("a:srgbClr")) if solid is not None else None
    if srgb is None:
        return
    _remove_children(srgb, ("a:alpha",))
    alpha_node = OxmlElement("a:alpha")
    alpha_node.set("val", str(alpha_value))
    srgb.append(alpha_node)

_apply_solid_alpha.__module__ = 'pptx2html.server.pptx_writer'
