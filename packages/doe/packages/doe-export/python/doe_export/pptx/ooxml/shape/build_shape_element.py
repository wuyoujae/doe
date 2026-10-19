# Origin: pptx2html/server/ooxml_pptx_writer.py::build_shape_element
from __future__ import annotations
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import has_image_payload
from doe_export.pptx.ooxml.shape.build_auto_shape import build_auto_shape
from doe_export.pptx.ooxml.xml.build_connector import build_connector
from doe_export.pptx.ooxml.xml.build_picture import build_picture
from doe_export.pptx.ooxml.table.build_table_graphic_frame import build_table_graphic_frame

def build_shape_element(ctx: SlideContext, shape: dict[str, Any]) -> ET.Element | None:
    if shape.get("type") == "group_shape":
        # Source-backed export can preserve imported groups, but the editor
        # does not yet synthesize new nested p:grpSp trees safely.
        return None
    if shape.get("table"):
        return build_table_graphic_frame(ctx, shape)
    if shape.get("type") == "picture" and has_image_payload(shape.get("image")):
        return build_picture(ctx, shape)
    if shape.get("type") == "connector" or shape.get("geometry") == "line":
        return build_connector(shape)
    return build_auto_shape(ctx, shape)

build_shape_element.__module__ = 'pptx2html.server.ooxml_pptx_writer'
