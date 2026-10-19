# Origin: pptx2html/server/ooxml_pptx_writer.py::preserve_source_picture_fill
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import A, copy
from doe_export.pptx.ooxml.assets.image_payload_changed import image_payload_changed
from doe_export.pptx.ooxml.xml.qn import qn

def preserve_source_picture_fill(
    source_container: ET.Element | None,
    fill: dict[str, Any] | None,
    original_fill: dict[str, Any] | None,
) -> ET.Element | None:
    """Copy a source blip fill when the media payload itself is unchanged."""
    if (
        source_container is None
        or (fill or {}).get("type") != "picture"
        or (original_fill or {}).get("type") != "picture"
    ):
        return None
    image = (fill or {}).get("image") or {}
    original_image = (original_fill or {}).get("image") or {}
    if image_payload_changed(image, original_image):
        return None
    source_blip_fill = source_container.find(qn(A, "blipFill"))
    if source_blip_fill is None or source_blip_fill.find(qn(A, "blip")) is None:
        return None
    return copy.deepcopy(source_blip_fill)

preserve_source_picture_fill.__module__ = 'pptx2html.server.ooxml_pptx_writer'
