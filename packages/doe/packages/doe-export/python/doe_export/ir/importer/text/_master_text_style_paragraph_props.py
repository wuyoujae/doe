# Origin: pptx2html/ir/builder.py::PresentationBuilder._master_text_style_paragraph_props
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, NAMESPACE

def _master_text_style_paragraph_props(
    self, shape: BaseShape, level: int
) -> dict:
    style_name = self._master_text_style_name(shape)
    props: dict = {}

    for part in reversed(self._placeholder_part_chain(shape)):
        master_elem = getattr(part, "element", None)
        if master_elem is None:
            continue
        tx_styles = master_elem.find(f"{{{NAMESPACE.PML_MAIN}}}txStyles")
        if tx_styles is None:
            continue
        style_elem = tx_styles.find(f"{{{NAMESPACE.PML_MAIN}}}{style_name}")
        if style_elem is not None:
            props.update(self._paragraph_props_from_text_style(style_elem, level))

    return props

_master_text_style_paragraph_props.__module__ = 'pptx2html.ir.builder'
_master_text_style_paragraph_props.__qualname__ = 'PresentationBuilder._master_text_style_paragraph_props'
