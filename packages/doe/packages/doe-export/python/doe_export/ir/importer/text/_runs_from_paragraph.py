# Origin: pptx2html/ir/builder.py::PresentationBuilder._runs_from_paragraph
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, ET, NAMESPACE, Run, local_name

def _runs_from_paragraph(
    self, shape: BaseShape, p_elem: ET.Element, default_font_props: dict
) -> list[Run]:
    _A = NAMESPACE.DML_MAIN
    runs: list[Run] = []
    for child in p_elem:
        name = local_name(child.tag)
        if name == "r":
            text = self._text_from_text_run(child)
            font_props = dict(default_font_props)
            font_props.update(
                self._font_props_from_rpr(child.find(f"{{{_A}}}rPr"), shape)
            )
            runs.append(
                Run(
                    text=text,
                    font=self._font_from_props(font_props, text),
                )
            )
        elif name == "br":
            font_props = dict(default_font_props)
            font_props.update(
                self._font_props_from_rpr(child.find(f"{{{_A}}}rPr"), shape)
            )
            runs.append(
                Run(kind="break", text="", font=self._font_from_props(font_props))
            )
        elif name == "fld":
            text = self._text_from_text_run(child)
            font_props = dict(default_font_props)
            font_props.update(
                self._font_props_from_rpr(child.find(f"{{{_A}}}rPr"), shape)
            )
            runs.append(
                Run(
                    kind="field",
                    text=text,
                    font=self._font_from_props(font_props, text),
                    field_id=child.get("id"),
                    field_type=child.get("type"),
                )
            )
    return runs

_runs_from_paragraph.__module__ = 'pptx2html.ir.builder'
_runs_from_paragraph.__qualname__ = 'PresentationBuilder._runs_from_paragraph'
