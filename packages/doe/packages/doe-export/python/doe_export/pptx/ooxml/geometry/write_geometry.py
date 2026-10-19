# Origin: pptx2html/server/ooxml_pptx_writer.py::write_geometry
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.geometry.build_custom_geometry import build_custom_geometry
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.remove_children import remove_children

def write_geometry(sp_pr: ET.Element, shape: dict[str, Any]) -> None:
    remove_children(sp_pr, {qn(A, "prstGeom"), qn(A, "custGeom")})
    paths = shape.get("geometry_paths") or []
    if paths and shape.get("geometry_source") == "custom":
        sp_pr.append(build_custom_geometry(paths, text_rect=shape.get("text_rect")))
        return
    prst = shape.get("geometry") or "rect"
    ET.SubElement(ET.SubElement(sp_pr, qn(A, "prstGeom"), {"prst": prst}), qn(A, "avLst"))

write_geometry.__module__ = 'pptx2html.server.ooxml_pptx_writer'
