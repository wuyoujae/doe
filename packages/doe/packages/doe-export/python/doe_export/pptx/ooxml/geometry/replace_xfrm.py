# Origin: pptx2html/server/ooxml_pptx_writer.py::replace_xfrm
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import A
from doe_export.pptx.ooxml.geometry.build_xfrm import build_xfrm
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.replace_direct_child import replace_direct_child

def replace_xfrm(sp_pr: ET.Element, shape: dict[str, Any]) -> None:
    replace_direct_child(sp_pr, qn(A, "xfrm"), build_xfrm(shape, qn(A, "xfrm")))

replace_xfrm.__module__ = 'pptx2html.server.ooxml_pptx_writer'
