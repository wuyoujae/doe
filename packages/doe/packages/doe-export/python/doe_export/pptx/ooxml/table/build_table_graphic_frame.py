# Origin: pptx2html/server/ooxml_pptx_writer.py::build_table_graphic_frame
from __future__ import annotations
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET, P, TABLE_URI
from doe_export.pptx.ooxml.table.build_table import build_table
from doe_export.pptx.ooxml.geometry.build_xfrm import build_xfrm
from doe_export.pptx.ooxml.xml.qn import qn

def build_table_graphic_frame(
    ctx: SlideContext,
    shape: dict[str, Any],
    *,
    source_element: ET.Element | None = None,
    original_shape: dict[str, Any] | None = None,
) -> ET.Element:
    shape_id = int(shape.get("shape_id") or 1)
    elem = ET.Element(qn(P, "graphicFrame"))
    nv = ET.SubElement(elem, qn(P, "nvGraphicFramePr"))
    ET.SubElement(nv, qn(P, "cNvPr"), {"id": str(shape_id), "name": shape.get("name") or f"Table {shape_id}"})
    ET.SubElement(nv, qn(P, "cNvGraphicFramePr"))
    ET.SubElement(nv, qn(P, "nvPr"))
    elem.append(build_xfrm(shape, qn(P, "xfrm")))

    graphic = ET.SubElement(elem, qn(A, "graphic"))
    graphic_data = ET.SubElement(graphic, qn(A, "graphicData"), {"uri": TABLE_URI})
    source_table = (
        source_element.find(f".//{{{A}}}tbl")
        if source_element is not None
        else None
    )
    graphic_data.append(
        build_table(
            ctx,
            shape.get("table") or {},
            source_table=source_table,
            original_table=(original_shape or {}).get("table"),
        )
    )
    return elem

build_table_graphic_frame.__module__ = 'pptx2html.server.ooxml_pptx_writer'
