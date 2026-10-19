# Origin: pptx2html/server/ooxml_pptx_writer.py::write_fill
from __future__ import annotations
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.append_srgb_color import append_srgb_color
from doe_export.pptx.ooxml.shape.insert_fill_child import insert_fill_child
from doe_export.pptx.ooxml.shape.patch_preserved_picture_fill import patch_preserved_picture_fill
from doe_export.pptx.ooxml.package.preserve_source_picture_fill import preserve_source_picture_fill
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.remove_children import remove_children
from doe_export.pptx.ooxml.shape.write_gradient_fill import write_gradient_fill
from doe_export.pptx.ooxml.shape.write_pattern_fill import write_pattern_fill
from doe_export.pptx.ooxml.shape.write_picture_fill import write_picture_fill

def write_fill(
    container: ET.Element,
    fill: dict[str, Any] | None,
    ctx: SlideContext | None = None,
    *,
    effects: list[dict[str, Any]] | None = None,
    source_container: ET.Element | None = None,
    original_fill: dict[str, Any] | None = None,
) -> None:
    preserved_picture_fill = preserve_source_picture_fill(
        source_container,
        fill,
        original_fill,
    )
    remove_children(container, {qn(A, "noFill"), qn(A, "solidFill"), qn(A, "gradFill"), qn(A, "pattFill"), qn(A, "blipFill")})
    if not fill or fill.get("type") in {None, "none"}:
        insert_fill_child(container, ET.Element(qn(A, "noFill")))
        return
    if fill.get("type") == "solid" and fill.get("color"):
        solid = ET.Element(qn(A, "solidFill"))
        append_srgb_color(solid, fill.get("color"), fill.get("alpha"))
        insert_fill_child(container, solid)
        return
    if fill.get("type") == "gradient":
        if write_gradient_fill(container, fill):
            return
        insert_fill_child(container, ET.Element(qn(A, "noFill")))
        return
    if fill.get("type") == "pattern":
        write_pattern_fill(container, fill)
        return
    if fill.get("type") == "picture":
        if preserved_picture_fill is not None:
            patch_preserved_picture_fill(
                preserved_picture_fill,
                fill,
                effects=effects,
            )
            insert_fill_child(container, preserved_picture_fill)
            return
        if ctx is not None and write_picture_fill(ctx, container, fill, effects=effects):
            return
        insert_fill_child(container, ET.Element(qn(A, "noFill")))
        return
    # Unsupported generated fills are left unfilled rather than emitting invalid
    # DrawingML. Existing imported unsupported fills are preserved unless the IR
    # changed enough to reach this writer branch.
    insert_fill_child(container, ET.Element(qn(A, "noFill")))

write_fill.__module__ = 'pptx2html.server.ooxml_pptx_writer'
