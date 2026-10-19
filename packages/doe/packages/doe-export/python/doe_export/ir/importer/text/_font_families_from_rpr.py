# Origin: pptx2html/ir/builder.py::PresentationBuilder._font_families_from_rpr
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE

@staticmethod
def _font_families_from_rpr(r_pr: ET.Element) -> dict[str, str]:
    _A = NAMESPACE.DML_MAIN
    props = {}
    for tag, prop_name in (
        ("latin", "latin_family"),
        ("ea", "ea_family"),
        ("cs", "cs_family"),
        ("sym", "sym_family"),
    ):
        font = r_pr.find(f"{{{_A}}}{tag}")
        if font is not None:
            typeface = font.get("typeface")
            if typeface:
                props[prop_name] = typeface
    return props

_font_families_from_rpr.__func__.__module__ = 'pptx2html.ir.builder'
_font_families_from_rpr.__func__.__qualname__ = 'PresentationBuilder._font_families_from_rpr'
