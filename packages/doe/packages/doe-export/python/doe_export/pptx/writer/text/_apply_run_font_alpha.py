# Origin: pptx2html/server/pptx_writer.py::_apply_run_font_alpha
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement, qn
from doe_export.pptx.writer.xml._alpha_to_ooxml import _alpha_to_ooxml
from doe_export.pptx.writer.xml._remove_children import _remove_children

def _apply_run_font_alpha(run, alpha: Any) -> None:
    alpha_value = _alpha_to_ooxml(alpha)
    if alpha_value is None or alpha_value >= 100000:
        return
    r_pr = run._r.get_or_add_rPr()
    solid = r_pr.find(qn("a:solidFill"))
    srgb = solid.find(qn("a:srgbClr")) if solid is not None else None
    if srgb is None:
        return
    _remove_children(srgb, ("a:alpha",))
    alpha_node = OxmlElement("a:alpha")
    alpha_node.set("val", str(alpha_value))
    srgb.append(alpha_node)

_apply_run_font_alpha.__module__ = 'pptx2html.server.pptx_writer'
