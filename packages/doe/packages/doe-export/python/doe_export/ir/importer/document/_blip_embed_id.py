# Origin: pptx2html/ir/builder.py::PresentationBuilder._blip_embed_id
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

@staticmethod
def _blip_embed_id(blip: ET.Element) -> Optional[str]:
    """Prefer the Office SVG relationship over its raster fallback.

        Picture shapes resolve their explicit image part before reaching this
        helper, so their long-standing raster-fallback behavior is unchanged.
        Picture fills call this helper directly and should expose the SVG to
        Canvas while retaining the fallback relationship in source OOXML.
        """
    for elem in blip.iter():
        if elem is blip:
            continue
        if elem.tag.endswith("}svgBlip"):
            r_id = elem.get(f"{{{NAMESPACE.OFC_RELATIONSHIPS}}}embed")
            if r_id:
                return r_id
    return blip.get(f"{{{NAMESPACE.OFC_RELATIONSHIPS}}}embed")

_blip_embed_id.__func__.__module__ = 'pptx2html.ir.builder'
_blip_embed_id.__func__.__qualname__ = 'PresentationBuilder._blip_embed_id'
