# Origin: pptx2html/server/ooxml_pptx_writer.py::build_custom_geometry
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.geometry.append_svg_path_commands import append_svg_path_commands
from doe_export.pptx.ooxml.xml.ooxml_coord import ooxml_coord
from doe_export.pptx.ooxml.xml.qn import qn

def build_custom_geometry(
    paths: list[dict[str, Any]],
    *,
    text_rect: dict[str, Any] | None = None,
) -> ET.Element:
    cust = ET.Element(qn(A, "custGeom"))
    for tag in ("avLst", "gdLst", "ahLst", "cxnLst", "rect"):
        if tag == "rect":
            rect = text_rect or {}
            ET.SubElement(
                cust,
                qn(A, tag),
                {
                    "l": ooxml_coord(rect.get("left")) if rect else "l",
                    "t": ooxml_coord(rect.get("top")) if rect else "t",
                    "r": ooxml_coord(rect.get("right")) if rect else "r",
                    "b": ooxml_coord(rect.get("bottom")) if rect else "b",
                },
            )
        else:
            ET.SubElement(cust, qn(A, tag))
    path_lst = ET.SubElement(cust, qn(A, "pathLst"))
    for path_ir in paths:
        path_elem = ET.SubElement(
            path_lst,
            qn(A, "path"),
            {"w": "100000", "h": "100000", "fill": "none" if path_ir.get("fill") == "none" else "norm"},
        )
        append_svg_path_commands(path_elem, path_ir.get("d") or "")
    return cust

build_custom_geometry.__module__ = 'pptx2html.server.ooxml_pptx_writer'
