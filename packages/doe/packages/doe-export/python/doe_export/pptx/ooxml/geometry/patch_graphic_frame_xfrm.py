# Origin: pptx2html/server/ooxml_pptx_writer.py::patch_graphic_frame_xfrm
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import A, P
from doe_export.pptx.ooxml.geometry.build_xfrm import build_xfrm
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.replace_direct_child import replace_direct_child
from doe_export.pptx.ooxml.shape.shape_changed import shape_changed

def patch_graphic_frame_xfrm(elem: ET.Element, shape: dict[str, Any], original: dict[str, Any] | None) -> None:
    if not shape_changed(shape.get("bounds"), (original or {}).get("bounds")):
        return
    xfrm = build_xfrm(shape, qn(P, "xfrm"))
    replace_direct_child(elem, qn(P, "xfrm"), xfrm, before_tag=qn(A, "graphic"))

patch_graphic_frame_xfrm.__module__ = 'pptx2html.server.ooxml_pptx_writer'
