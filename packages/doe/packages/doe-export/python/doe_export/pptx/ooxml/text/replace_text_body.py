# Origin: pptx2html/server/ooxml_pptx_writer.py::replace_text_body
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import P
from doe_export.pptx.ooxml.text.build_text_body import build_text_body
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.remove_children import remove_children

def replace_text_body(
    shape_elem: ET.Element,
    text_frame: dict[str, Any] | None,
    *,
    container_metrics: dict[str, Any] | None = None,
) -> None:
    remove_children(shape_elem, {qn(P, "txBody")})
    if text_frame:
        shape_elem.append(
            build_text_body(
                text_frame,
                namespace=P,
                container_metrics=container_metrics,
            )
        )

replace_text_body.__module__ = 'pptx2html.server.ooxml_pptx_writer'
