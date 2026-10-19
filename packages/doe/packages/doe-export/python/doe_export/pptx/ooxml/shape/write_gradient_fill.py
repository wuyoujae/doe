# Origin: pptx2html/server/ooxml_pptx_writer.py::write_gradient_fill
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.append_srgb_color import append_srgb_color
from doe_export.pptx.ooxml.xml.bool_value import bool_value
from doe_export.pptx.ooxml.shape.insert_fill_child import insert_fill_child
from doe_export.pptx.ooxml.xml.percent_attr import percent_attr
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.rect_percent_attrs import rect_percent_attrs

def write_gradient_fill(container: ET.Element, fill: dict[str, Any]) -> bool:
    stops = [
        stop
        for stop in (fill.get("gradient_stops") or [])
        if isinstance(stop, dict) and stop.get("color")
    ]
    if not stops:
        return False
    attrs: dict[str, str] = {}
    if fill.get("gradient_rotate_with_shape") is not None:
        attrs["rotWithShape"] = bool_value(fill.get("gradient_rotate_with_shape"))
    grad = ET.Element(qn(A, "gradFill"), attrs)
    gs_lst = ET.SubElement(grad, qn(A, "gsLst"))
    for stop in sorted(stops, key=lambda item: float(item.get("position") or 0)):
        gs = ET.SubElement(gs_lst, qn(A, "gs"), {"pos": percent_attr(stop.get("position"))})
        append_srgb_color(gs, stop.get("color"), stop.get("alpha"))
    if fill.get("gradient_path"):
        path = ET.SubElement(grad, qn(A, "path"), {"path": str(fill.get("gradient_path"))})
        rect_attrs = rect_percent_attrs(
            fill,
            {
                "gradient_fill_to_left": "l",
                "gradient_fill_to_top": "t",
                "gradient_fill_to_right": "r",
                "gradient_fill_to_bottom": "b",
            },
        )
        if rect_attrs:
            ET.SubElement(path, qn(A, "fillToRect"), rect_attrs)
    else:
        lin_attrs: dict[str, str] = {}
        if fill.get("gradient_angle") is not None:
            lin_attrs["ang"] = str(int(round(float(fill.get("gradient_angle") or 0) * 60000)))
        if fill.get("gradient_scaled") is not None:
            lin_attrs["scaled"] = bool_value(fill.get("gradient_scaled"))
        ET.SubElement(grad, qn(A, "lin"), lin_attrs)
    insert_fill_child(container, grad)
    return True

write_gradient_fill.__module__ = 'pptx2html.server.ooxml_pptx_writer'
