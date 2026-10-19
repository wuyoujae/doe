# Origin: pptx2html/ir/builder.py::PresentationBuilder._default_paragraph_props
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, ET

def _default_paragraph_props(
    self, shape: BaseShape, tf_elem: ET.Element, p_elem: ET.Element, level: int
) -> dict:
    props: dict = {}

    if self._presentation_default_text_style is not None:
        props.update(
            self._paragraph_props_from_text_style(
                self._presentation_default_text_style, level
            )
        )

    props.update(self._master_text_style_paragraph_props(shape, level))

    for inherited_shape in reversed(self._placeholder_sources(shape)):
        inherited_tf = inherited_shape.text_frame
        if inherited_tf is None:
            continue
        props.update(
            self._paragraph_props_from_text_defaults(
                inherited_tf._element,
                self._paragraph_for_level(inherited_tf._element, level),
                level,
            )
        )

    props.update(self._paragraph_props_from_text_defaults(tf_elem, p_elem, level))
    return props

_default_paragraph_props.__module__ = 'pptx2html.ir.builder'
_default_paragraph_props.__qualname__ = 'PresentationBuilder._default_paragraph_props'
