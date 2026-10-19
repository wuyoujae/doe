# Origin: pptx2html/server/pptx_writer.py::_append_blip_fill_layout
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement
from doe_export.pptx.writer.xml._append_src_rect import _append_src_rect
from doe_export.pptx.writer.xml._pt_to_emu import _pt_to_emu
from doe_export.pptx.writer.xml._remove_children import _remove_children
from doe_export.pptx.writer.geometry._scale_to_ooxml import _scale_to_ooxml
from doe_export.pptx.writer.xml._signed_percent_to_ooxml import _signed_percent_to_ooxml

def _append_blip_fill_layout(blip_fill, image: dict[str, Any]) -> None:
    _remove_children(blip_fill, ("a:srcRect", "a:tile", "a:stretch"))
    _append_src_rect(blip_fill, image)
    if image.get("tile"):
        tile = OxmlElement("a:tile")
        for key, attr in (("tile_scale_x", "sx"), ("tile_scale_y", "sy")):
            if image.get(key) is not None:
                tile.set(attr, str(_scale_to_ooxml(image.get(key))))
        for key, attr in (("tile_offset_x_pt", "tx"), ("tile_offset_y_pt", "ty")):
            if image.get(key) is not None:
                tile.set(attr, str(_pt_to_emu(image.get(key))))
        if image.get("tile_align"):
            tile.set("algn", str(image.get("tile_align")))
        if image.get("tile_flip"):
            tile.set("flip", str(image.get("tile_flip")))
        blip_fill.append(tile)
        return

    stretch = OxmlElement("a:stretch")
    fill_rect = OxmlElement("a:fillRect")
    for key, attr in (
        ("stretch_left", "l"),
        ("stretch_right", "r"),
        ("stretch_top", "t"),
        ("stretch_bottom", "b"),
    ):
        if image.get(key) is not None:
            fill_rect.set(attr, str(_signed_percent_to_ooxml(image.get(key))))
    stretch.append(fill_rect)
    blip_fill.append(stretch)

_append_blip_fill_layout.__module__ = 'pptx2html.server.pptx_writer'
