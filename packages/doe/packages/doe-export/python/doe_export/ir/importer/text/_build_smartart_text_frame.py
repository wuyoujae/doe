# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_smartart_text_frame
from __future__ import annotations
from doe_export.ir.importer.shared import Font, GraphicFrame, NAMESPACE, Optional, Paragraph, Run, TextFrame, local_name

def _build_smartart_text_frame(self, shape: GraphicFrame) -> Optional[TextFrame]:
    if not shape.uri or "diagram" not in shape.uri:
        return None
    data = shape._find_graphic_data()
    if data is None:
        return None
    rel_ids = next((child for child in data if local_name(child.tag) == "relIds"), None)
    r_id = rel_ids.get(f"{{{NAMESPACE.OFC_RELATIONSHIPS}}}dm") if rel_ids is not None else None
    if not r_id:
        return None
    diagram_part = self._related_part_by_id(shape, r_id)
    diagram = getattr(diagram_part, "element", None)
    if diagram is None:
        return None
    texts: list[str] = []
    for elem in diagram.iter():
        if local_name(elem.tag) != "t" or not elem.text:
            continue
        text = elem.text.strip()
        if text:
            texts.append(text)
    if not texts:
        return None
    return TextFrame(
        word_wrap=True,
        margins=self._effective_text_margins(None),
        style_provenance=["diagramData.textFallback"],
        paragraphs=[
            Paragraph(
                runs=[Run(text=text, font=Font(size_pt=14.0, color="333333"))],
            )
            for text in texts
        ],
    )

_build_smartart_text_frame.__module__ = 'pptx2html.ir.builder'
_build_smartart_text_frame.__qualname__ = 'PresentationBuilder._build_smartart_text_frame'
