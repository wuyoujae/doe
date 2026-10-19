# Origin: pptx2html/ir/builder.py::PresentationBuilder._merge_text_body_props_from_body_pr
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional

def _merge_text_body_props_from_body_pr(
    self,
    props: dict,
    margin_values: dict[str, Optional[float]],
    diagnostics: list[str],
    body_pr: Optional[ET.Element],
) -> None:
    if body_pr is None:
        return

    body_props = self._text_body_props(body_pr)
    diagnostics.extend(body_props.pop("diagnostics", []))
    for key, value in body_props.items():
        if value is not None:
            props[key] = value

    for key, value in self._text_margins_from_body_pr(body_pr).items():
        if value is not None:
            margin_values[key] = value

_merge_text_body_props_from_body_pr.__module__ = 'pptx2html.ir.builder'
_merge_text_body_props_from_body_pr.__qualname__ = 'PresentationBuilder._merge_text_body_props_from_body_pr'
