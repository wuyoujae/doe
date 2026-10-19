# Origin: pptx2html/server/pptx_writer.py::_build_blip_fill
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement, qn
from doe_export.pptx.writer.xml._append_blip_alpha import _append_blip_alpha
from doe_export.pptx.writer.xml._append_blip_effects import _append_blip_effects
from doe_export.pptx.writer.shape._append_blip_fill_layout import _append_blip_fill_layout
from doe_export.pptx.writer.xml._combined_alpha import _combined_alpha
from doe_export.pptx.writer.assets._merged_image_effects import _merged_image_effects

def _build_blip_fill(
    rel_id: str,
    image: dict[str, Any],
    *,
    fill_alpha: Any = None,
    effects: list[dict[str, Any]] | None = None,
):
    blip_fill = OxmlElement("a:blipFill")
    blip = OxmlElement("a:blip")
    blip.set(qn("r:embed"), rel_id)
    _append_blip_alpha(blip, _combined_alpha(fill_alpha, image.get("alpha")))
    _append_blip_effects(blip, _merged_image_effects(image.get("effects"), effects))
    blip_fill.append(blip)
    _append_blip_fill_layout(blip_fill, image)
    return blip_fill

_build_blip_fill.__module__ = 'pptx2html.server.pptx_writer'
