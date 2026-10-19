# Origin: pptx2html/server/ooxml_pptx_writer.py::patch_common_shape_props
from __future__ import annotations
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.xml.find_or_create import find_or_create
from doe_export.pptx.ooxml.geometry.replace_xfrm import replace_xfrm
from doe_export.pptx.ooxml.shape.shape_changed import shape_changed
from doe_export.pptx.ooxml.shape.write_fill import write_fill
from doe_export.pptx.ooxml.shape.write_line import write_line
from doe_export.pptx.ooxml.shape.write_shadow import write_shadow

def patch_common_shape_props(ctx: SlideContext, elem: ET.Element, shape: dict[str, Any], original: dict[str, Any] | None) -> None:
    sp_pr = find_or_create(elem, [("p", "spPr")])
    if shape_changed(shape.get("bounds"), (original or {}).get("bounds")) or shape_changed(shape.get("rotation"), (original or {}).get("rotation")):
        replace_xfrm(sp_pr, shape)
    fill_changed = shape_changed(shape.get("fill"), (original or {}).get("fill"))
    effects_changed = shape_changed(shape.get("effects"), (original or {}).get("effects"))
    if fill_changed or ((shape.get("fill") or {}).get("type") == "picture" and effects_changed):
        write_fill(
            sp_pr,
            shape.get("fill"),
            ctx,
            effects=shape.get("effects"),
            source_container=sp_pr,
            original_fill=(original or {}).get("fill"),
        )
    if shape_changed(shape.get("border"), (original or {}).get("border")):
        write_line(sp_pr, shape.get("border"))
    if shape_changed(shape.get("shadow"), (original or {}).get("shadow")):
        write_shadow(sp_pr, shape.get("shadow"))

patch_common_shape_props.__module__ = 'pptx2html.server.ooxml_pptx_writer'
