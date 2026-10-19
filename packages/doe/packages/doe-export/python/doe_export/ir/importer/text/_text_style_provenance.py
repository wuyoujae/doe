# Origin: pptx2html/ir/builder.py::PresentationBuilder._text_style_provenance
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, ET, NAMESPACE, Optional

def _text_style_provenance(
    self,
    shape: BaseShape,
    tf_elem: ET.Element,
    table_font_props: Optional[dict] = None,
) -> list[str]:
    sources: list[str] = []
    if self._presentation_default_text_style is not None:
        sources.append("presentation.defaultTextStyle")

    style_name = self._master_text_style_name(shape)
    for part in reversed(self._placeholder_part_chain(shape)):
        master_elem = getattr(part, "element", None)
        tx_styles = (
            master_elem.find(f"{{{NAMESPACE.PML_MAIN}}}txStyles")
            if master_elem is not None
            else None
        )
        if tx_styles is not None and tx_styles.find(f"{{{NAMESPACE.PML_MAIN}}}{style_name}") is not None:
            sources.append(f"master.txStyles.{style_name}")
            break

    inherited_count = sum(1 for item in self._placeholder_sources(shape) if item.text_frame is not None)
    if inherited_count:
        sources.append(f"placeholder.textDefaults:{inherited_count}")
    if self._style_ref(shape, "fontRef") is not None:
        sources.append("shape.style.fontRef")
    if table_font_props:
        sources.append("tableStyle.text")
    if tf_elem.find(f"{{{NAMESPACE.DML_MAIN}}}lstStyle") is not None:
        sources.append("shape.txBody.lstStyle")
    if any(
        p.find(f"{{{NAMESPACE.DML_MAIN}}}pPr/{{{NAMESPACE.DML_MAIN}}}defRPr") is not None
        for p in tf_elem.findall(f"{{{NAMESPACE.DML_MAIN}}}p")
    ):
        sources.append("paragraph.pPr.defRPr")
    if any(
        p.find(f"{{{NAMESPACE.DML_MAIN}}}endParaRPr") is not None
        for p in tf_elem.findall(f"{{{NAMESPACE.DML_MAIN}}}p")
    ):
        sources.append("paragraph.endParaRPr")
    return sources

_text_style_provenance.__module__ = 'pptx2html.ir.builder'
_text_style_provenance.__qualname__ = 'PresentationBuilder._text_style_provenance'
