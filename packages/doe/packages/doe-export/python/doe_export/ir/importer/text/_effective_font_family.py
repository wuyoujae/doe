# Origin: pptx2html/ir/builder.py::PresentationBuilder._effective_font_family
from __future__ import annotations
from doe_export.ir.importer.shared import Optional

@staticmethod
def _effective_font_family(props: dict, text: str) -> Optional[str]:
    from pptx2html.ir.builder import PresentationBuilder
    if PresentationBuilder._contains_cjk(text):
        return (
            props.get("ea_family")
            or props.get("latin_family")
            or props.get("cs_family")
            or props.get("family")
            or props.get("sym_family")
        )
    return (
        props.get("latin_family")
        or props.get("family")
        or props.get("ea_family")
        or props.get("cs_family")
        or props.get("sym_family")
    )

_effective_font_family.__func__.__module__ = 'pptx2html.ir.builder'
_effective_font_family.__func__.__qualname__ = 'PresentationBuilder._effective_font_family'
