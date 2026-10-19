# Origin: pptx2html/server/ooxml_pptx_writer.py::build_table_cell
from __future__ import annotations
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.shape.build_line import build_line
from doe_export.pptx.ooxml.text.build_text_body import build_text_body
from doe_export.pptx.ooxml.text.plain_text_frame import plain_text_frame
from doe_export.pptx.ooxml.xml.pt_to_emu import pt_to_emu
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.safe_int import safe_int
from doe_export.pptx.ooxml.text.text_anchor import text_anchor
from doe_export.pptx.ooxml.shape.write_fill import write_fill

def build_table_cell(
    ctx: SlideContext,
    cell: dict[str, Any],
    *,
    container_metrics: dict[str, Any] | None = None,
    source_cell: ET.Element | None = None,
    original_cell: dict[str, Any] | None = None,
) -> ET.Element:
    attrs: dict[str, str] = {}
    if safe_int(cell.get("colspan"), 1) > 1:
        attrs["gridSpan"] = str(safe_int(cell.get("colspan"), 1))
    if safe_int(cell.get("rowspan"), 1) > 1:
        attrs["rowSpan"] = str(safe_int(cell.get("rowspan"), 1))
    if cell.get("h_merge"):
        attrs["hMerge"] = "1"
    if cell.get("v_merge"):
        attrs["vMerge"] = "1"
    tc = ET.Element(qn(A, "tc"), attrs)
    tc.append(
        build_text_body(
            cell.get("text_frame") or plain_text_frame(cell.get("text") or ""),
            namespace=A,
            container_metrics=container_metrics,
        )
    )
    tc_pr = ET.SubElement(tc, qn(A, "tcPr"))
    margins = cell.get("margins") or {}
    for key, attr in (("left", "marL"), ("right", "marR"), ("top", "marT"), ("bottom", "marB")):
        if margins.get(key) is not None:
            tc_pr.set(attr, str(pt_to_emu(margins.get(key))))
    if cell.get("vertical_align"):
        tc_pr.set("anchor", text_anchor(cell.get("vertical_align")))
    for key, tag in (("border_left", "lnL"), ("border_right", "lnR"), ("border_top", "lnT"), ("border_bottom", "lnB")):
        border = cell.get(key)
        if border is not None:
            ln = build_line(border, tag=qn(A, tag))
            tc_pr.append(ln)
    write_fill(
        tc_pr,
        cell.get("fill"),
        ctx,
        source_container=(
            source_cell.find(f"{{{A}}}tcPr") if source_cell is not None else None
        ),
        original_fill=(original_cell or {}).get("fill"),
    )
    return tc

build_table_cell.__module__ = 'pptx2html.server.ooxml_pptx_writer'
