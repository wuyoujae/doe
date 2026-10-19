# Origin: pptx2html/server/ooxml_pptx_writer.py::build_group_xfrm
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.geometry.build_xfrm import build_xfrm
from doe_export.pptx.ooxml.xml.finite_number import finite_number
from doe_export.pptx.ooxml.geometry.format_shape_path import format_shape_path
from doe_export.pptx.ooxml.xml.pt_to_emu import pt_to_emu
from doe_export.pptx.ooxml.xml.qn import qn

def build_group_xfrm(shape: dict[str, Any], *, shape_path: tuple[int, ...]) -> ET.Element:
    group_bounds = shape.get("group_bounds")
    if not isinstance(shape.get("bounds"), dict) or not isinstance(group_bounds, dict):
        raise ValueError(
            f"Source-backed PPTX export cannot write group transform at path {format_shape_path(shape_path)}"
        )
    width = finite_number(group_bounds.get("width"))
    height = finite_number(group_bounds.get("height"))
    if width <= 0 or height <= 0:
        raise ValueError(
            f"Source-backed PPTX export found an invalid child coordinate space at path {format_shape_path(shape_path)}"
        )
    xfrm = build_xfrm(shape, qn(A, "xfrm"))
    ET.SubElement(
        xfrm,
        qn(A, "chOff"),
        {
            "x": str(pt_to_emu(group_bounds.get("left") or 0)),
            "y": str(pt_to_emu(group_bounds.get("top") or 0)),
        },
    )
    ET.SubElement(
        xfrm,
        qn(A, "chExt"),
        {"cx": str(pt_to_emu(width)), "cy": str(pt_to_emu(height))},
    )
    return xfrm

build_group_xfrm.__module__ = 'pptx2html.server.ooxml_pptx_writer'
