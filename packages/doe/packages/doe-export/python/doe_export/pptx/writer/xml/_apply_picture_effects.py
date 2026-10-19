# Origin: pptx2html/server/pptx_writer.py::_apply_picture_effects
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.xml._append_blip_effects import _append_blip_effects
from doe_export.pptx.writer.xml._first_xml_descendant import _first_xml_descendant

def _apply_picture_effects(pptx_shape, effects: list[dict[str, Any]] | None) -> None:
    blip = _first_xml_descendant(pptx_shape._element, "a:blip")
    if blip is None:
        return
    _append_blip_effects(blip, effects)

_apply_picture_effects.__module__ = 'pptx2html.server.pptx_writer'
