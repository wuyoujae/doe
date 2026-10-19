# Origin: pptx2html/server/pptx_writer.py::_append_blip_effects
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement
from doe_export.pptx.writer.xml._remove_children import _remove_children

def _append_blip_effects(blip, effects: list[dict[str, Any]] | None) -> None:
    _remove_children(blip, ("a:grayscl",))
    if not any(str(effect.get("type") or "") == "grayscale" for effect in (effects or [])):
        return
    blip.append(OxmlElement("a:grayscl"))

_append_blip_effects.__module__ = 'pptx2html.server.pptx_writer'
