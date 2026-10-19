# Origin: pptx2html/ir/builder.py::PresentationBuilder._default_font_props
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, ET, Optional

def _default_font_props(
    self,
    shape: BaseShape,
    tf_elem: ET.Element,
    p_elem: ET.Element,
    level: int,
    table_font_props: Optional[dict] = None,
) -> dict:
    props = {}
    if self._presentation_default_text_style is not None:
        props.update(
            self._font_props_from_level_style(
                self._presentation_default_text_style, level
            )
        )
    props.update(self._master_text_style_props(shape, level))

    for inherited_shape in reversed(self._placeholder_sources(shape)):
        inherited_tf = inherited_shape.text_frame
        if inherited_tf is None:
            continue
        props.update(
            self._font_props_from_text_defaults(
                inherited_tf._element,
                self._paragraph_for_level(inherited_tf._element, level),
                level,
            )
        )

    props.update(self._font_props_from_shape_style_ref(shape))
    if table_font_props:
        props.update(table_font_props)
    props.update(self._font_props_from_text_defaults(tf_elem, p_elem, level))
    return props

_default_font_props.__module__ = 'pptx2html.ir.builder'
_default_font_props.__qualname__ = 'PresentationBuilder._default_font_props'
