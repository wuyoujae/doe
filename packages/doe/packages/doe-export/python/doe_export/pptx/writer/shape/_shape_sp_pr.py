# Origin: pptx2html/server/pptx_writer.py::_shape_sp_pr
from __future__ import annotations
from doe_export.pptx.writer.shared import OxmlElement, qn

def _shape_sp_pr(pptx_shape):
    element = pptx_shape._element
    if hasattr(element, "get_or_add_spPr"):
        return element.get_or_add_spPr()
    sp_pr = element.find(qn("p:spPr"))
    if sp_pr is None:
        sp_pr = OxmlElement("p:spPr")
        element.append(sp_pr)
    return sp_pr

_shape_sp_pr.__module__ = 'pptx2html.server.pptx_writer'
