# Origin: pptx2html/server/ooxml_pptx_writer.py::patch_shape_element
from __future__ import annotations
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import P
from doe_export.pptx.ooxml.shape.build_auto_shape import build_auto_shape
from doe_export.pptx.ooxml.xml.build_connector import build_connector
from doe_export.pptx.ooxml.xml.build_picture import build_picture
from doe_export.pptx.ooxml.table.build_table_graphic_frame import build_table_graphic_frame
from doe_export.pptx.ooxml.shape.patch_common_shape_props import patch_common_shape_props
from doe_export.pptx.ooxml.geometry.patch_graphic_frame_xfrm import patch_graphic_frame_xfrm
from doe_export.pptx.ooxml.xml.patch_picture import patch_picture
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.text.replace_text_body import replace_text_body
from doe_export.pptx.ooxml.shape.shape_changed import shape_changed
from doe_export.pptx.ooxml.text.shape_text_container_metrics import shape_text_container_metrics

def patch_shape_element(
    ctx: SlideContext,
    elem: ET.Element,
    shape: dict[str, Any],
    original: dict[str, Any] | None,
    *,
    shape_path: tuple[int, ...] = (),
) -> ET.Element | None:
    from doe_export.pptx.ooxml.shape.patch_group_shape import patch_group_shape
    if shape.get("type") == "group_shape":
        if elem.tag == qn(P, "grpSp"):
            patch_group_shape(ctx, elem, shape, original or {}, shape_path=shape_path)
            return elem
        return None

    if shape.get("table"):
        if elem.tag != qn(P, "graphicFrame") or shape_changed(shape.get("table"), (original or {}).get("table")):
            return build_table_graphic_frame(
                ctx,
                shape,
                source_element=elem if elem.tag == qn(P, "graphicFrame") else None,
                original_shape=original,
            )
        patch_graphic_frame_xfrm(elem, shape, original)
        return elem

    if shape.get("type") == "picture":
        if elem.tag != qn(P, "pic"):
            return build_picture(ctx, shape)
        patch_picture(ctx, elem, shape, original)
        return elem

    if shape.get("type") == "connector" or shape.get("geometry") == "line":
        if elem.tag != qn(P, "cxnSp"):
            return build_connector(shape)
        patch_common_shape_props(ctx, elem, shape, original)
        return elem

    if elem.tag != qn(P, "sp"):
        return build_auto_shape(ctx, shape)

    patch_common_shape_props(ctx, elem, shape, original)
    if shape_changed(shape.get("text"), (original or {}).get("text")):
        replace_text_body(
            elem,
            shape.get("text"),
            container_metrics=shape_text_container_metrics(shape),
        )
    return elem

patch_shape_element.__module__ = 'pptx2html.server.ooxml_pptx_writer'
