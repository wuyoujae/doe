# Origin: pptx2html/ir/builder.py::PresentationBuilder._effective_text_body_props
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, ET, NAMESPACE, Optional

def _effective_text_body_props(
    self,
    shape: BaseShape,
    tf_elem: ET.Element,
    word_wrap: Optional[bool] = None,
    margins: Optional[dict[str, Optional[float]]] = None,
) -> dict:
    props: dict = {}
    margin_values: dict[str, Optional[float]] = {
        "left": None,
        "right": None,
        "top": None,
        "bottom": None,
    }
    wrap_value: Optional[bool] = None
    diagnostics: list[str] = []

    for inherited_shape in reversed(self._placeholder_sources(shape)):
        inherited_tf = inherited_shape.text_frame
        if inherited_tf is None:
            continue
        inherited_body_pr = inherited_tf._element.find(f"{{{NAMESPACE.DML_MAIN}}}bodyPr")
        self._merge_text_body_props_from_body_pr(
            props,
            margin_values,
            diagnostics,
            inherited_body_pr,
        )
        if inherited_body_pr is not None and inherited_body_pr.get("wrap") is not None:
            wrap_value = self._word_wrap_from_body_pr(inherited_body_pr)

    local_body_pr = tf_elem.find(f"{{{NAMESPACE.DML_MAIN}}}bodyPr")
    self._merge_text_body_props_from_body_pr(
        props,
        margin_values,
        diagnostics,
        local_body_pr,
    )
    if local_body_pr is not None and local_body_pr.get("wrap") is not None:
        wrap_value = self._word_wrap_from_body_pr(local_body_pr)

    if word_wrap is not None:
        wrap_value = word_wrap
    if margins is not None:
        for key, value in margins.items():
            if value is not None:
                margin_values[key] = value

    props["word_wrap"] = True if wrap_value is None else wrap_value
    props["margins"] = self._effective_text_margins(margin_values)
    props["diagnostics"] = diagnostics
    return props

_effective_text_body_props.__module__ = 'pptx2html.ir.builder'
_effective_text_body_props.__qualname__ = 'PresentationBuilder._effective_text_body_props'
