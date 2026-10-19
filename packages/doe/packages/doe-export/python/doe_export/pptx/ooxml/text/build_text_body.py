# Origin: pptx2html/server/ooxml_pptx_writer.py::build_text_body
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET, P, materialize_layout_snapshot, normalize_htmlir_export_line_edges
from doe_export.pptx.ooxml.xml.build_body_pr import build_body_pr
from doe_export.pptx.ooxml.text.build_paragraph import build_paragraph
from doe_export.pptx.ooxml.xml.qn import qn

def build_text_body(
    text_frame: dict[str, Any],
    *,
    namespace: str = P,
    container_metrics: dict[str, Any] | None = None,
) -> ET.Element:
    if container_metrics is not None:
        text_frame = (
            materialize_layout_snapshot(
                text_frame,
                container_metrics=container_metrics,
            )
            or text_frame
        )
    text_frame = normalize_htmlir_export_line_edges(text_frame)
    tx_body = ET.Element(qn(namespace, "txBody"))
    tx_body.append(build_body_pr(text_frame))
    ET.SubElement(tx_body, qn(A, "lstStyle"))
    paragraphs = text_frame.get("paragraphs") or [{"runs": [{"text": ""}]}]
    for paragraph in paragraphs:
        tx_body.append(build_paragraph(paragraph))
    return tx_body

build_text_body.__module__ = 'pptx2html.server.ooxml_pptx_writer'
