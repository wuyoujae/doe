# Origin: pptx2html/server/pptx_writer.py::_apply_picture_crop_and_alpha
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import qn
from doe_export.pptx.writer.xml._append_blip_alpha import _append_blip_alpha
from doe_export.pptx.writer.shape._append_blip_fill_layout import _append_blip_fill_layout

def _apply_picture_crop_and_alpha(picture, image: dict[str, Any]) -> None:
    blip_fill = picture._element.find(qn("p:blipFill"))
    if blip_fill is None:
        return
    _append_blip_fill_layout(blip_fill, image)
    blip = blip_fill.find(qn("a:blip"))
    if blip is not None:
        _append_blip_alpha(blip, image.get("alpha"))

_apply_picture_crop_and_alpha.__module__ = 'pptx2html.server.pptx_writer'
