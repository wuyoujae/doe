# Origin: pptx2html/server/pptx_writer.py::_apply_custom_geometry
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement, qn
from doe_export.pptx.writer.geometry._append_svg_line_path import _append_svg_line_path
from doe_export.pptx.writer.xml._ooxml_coord import _ooxml_coord
from doe_export.pptx.writer.xml._remove_children import _remove_children
from doe_export.pptx.writer.shape._shape_sp_pr import _shape_sp_pr

def _apply_custom_geometry(pptx_shape, shape: dict[str, Any]) -> None:
    if shape.get("geometry_source") != "custom" or not shape.get("geometry_paths"):
        return
    sp_pr = _shape_sp_pr(pptx_shape)
    _remove_children(sp_pr, ("a:prstGeom", "a:custGeom"))
    cust = OxmlElement("a:custGeom")
    for tag in ("a:avLst", "a:gdLst", "a:ahLst", "a:cxnLst"):
        cust.append(OxmlElement(tag))
    rect = OxmlElement("a:rect")
    text_rect = shape.get("text_rect") or {}
    rect.set("l", _ooxml_coord(text_rect.get("left")) if text_rect else "l")
    rect.set("t", _ooxml_coord(text_rect.get("top")) if text_rect else "t")
    rect.set("r", _ooxml_coord(text_rect.get("right")) if text_rect else "r")
    rect.set("b", _ooxml_coord(text_rect.get("bottom")) if text_rect else "b")
    cust.append(rect)
    path_lst = OxmlElement("a:pathLst")
    for path_ir in shape.get("geometry_paths") or []:
        path = OxmlElement("a:path")
        path.set("w", "100000")
        path.set("h", "100000")
        path.set("fill", "none" if path_ir.get("fill") == "none" else "norm")
        _append_svg_line_path(path, path_ir.get("d") or "")
        path_lst.append(path)
    cust.append(path_lst)
    insert_at = 1 if len(sp_pr) and sp_pr[0].tag == qn("a:xfrm") else 0
    sp_pr.insert(insert_at, cust)

_apply_custom_geometry.__module__ = 'pptx2html.server.pptx_writer'
