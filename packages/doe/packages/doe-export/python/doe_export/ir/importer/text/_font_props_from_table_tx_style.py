# Origin: pptx2html/ir/builder.py::PresentationBuilder._font_props_from_table_tx_style
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, parse_bool

def _font_props_from_table_tx_style(self, tx_style: ET.Element) -> dict:
    _A = NAMESPACE.DML_MAIN
    props: dict = {}
    for attr, prop_name in (("b", "bold"), ("i", "italic")):
        parsed = parse_bool(tx_style.get(attr))
        if parsed is not None:
            props[prop_name] = parsed

    font_ref = tx_style.find(f"{{{_A}}}fontRef")
    if font_ref is not None:
        idx = (font_ref.get("idx") or "").lower()
        if idx in {"major", "minor"}:
            for key, slot in (
                ("latin_family", "latin"),
                ("ea_family", "ea"),
                ("cs_family", "cs"),
            ):
                family = self._theme_fonts.get(f"{idx}_{slot}")
                if family:
                    props[key] = family
            family = props.get("latin_family") or props.get("ea_family") or props.get("cs_family")
            if family:
                props["family"] = family

    color, _ = self._color_from_fill_elem(tx_style)
    if not color and font_ref is not None:
        color, _ = self._color_from_fill_elem(font_ref)
    if color:
        props["color"] = color

    return props

_font_props_from_table_tx_style.__module__ = 'pptx2html.ir.builder'
_font_props_from_table_tx_style.__qualname__ = 'PresentationBuilder._font_props_from_table_tx_style'
