# Origin: pptx2html/server/ooxml_pptx_writer.py::write_blip_fill_layout
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.pt_to_emu import pt_to_emu
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.rect_percent_attrs import rect_percent_attrs
from doe_export.pptx.ooxml.xml.remove_children import remove_children
from doe_export.pptx.ooxml.xml.safe_float import safe_float
from doe_export.pptx.ooxml.geometry.scale_percent_attr import scale_percent_attr
from doe_export.pptx.ooxml.xml.write_src_rect import write_src_rect

def write_blip_fill_layout(blip_fill: ET.Element, image: dict[str, Any]) -> None:
    remove_children(blip_fill, {qn(A, "srcRect"), qn(A, "tile"), qn(A, "stretch")})
    write_src_rect(blip_fill, image)
    if image.get("tile"):
        tile_attrs: dict[str, str] = {}
        for key, attr in (("tile_scale_x", "sx"), ("tile_scale_y", "sy")):
            if image.get(key) is not None:
                tile_attrs[attr] = scale_percent_attr(image.get(key))
        for key, attr in (("tile_offset_x_pt", "tx"), ("tile_offset_y_pt", "ty")):
            if image.get(key) is not None:
                tile_attrs[attr] = str(pt_to_emu(safe_float(image.get(key))))
        if image.get("tile_align"):
            tile_attrs["algn"] = str(image.get("tile_align"))
        if image.get("tile_flip"):
            tile_attrs["flip"] = str(image.get("tile_flip"))
        ET.SubElement(blip_fill, qn(A, "tile"), tile_attrs)
    else:
        stretch = ET.SubElement(blip_fill, qn(A, "stretch"))
        fill_rect_attrs = rect_percent_attrs(
            image,
            {
                "stretch_left": "l",
                "stretch_top": "t",
                "stretch_right": "r",
                "stretch_bottom": "b",
            },
            signed=True,
        )
        ET.SubElement(stretch, qn(A, "fillRect"), fill_rect_attrs)

write_blip_fill_layout.__module__ = 'pptx2html.server.ooxml_pptx_writer'
