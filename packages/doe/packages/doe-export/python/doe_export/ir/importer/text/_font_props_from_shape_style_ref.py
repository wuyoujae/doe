# Origin: pptx2html/ir/builder.py::PresentationBuilder._font_props_from_shape_style_ref
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape

def _font_props_from_shape_style_ref(self, shape: BaseShape) -> dict:
    ref = self._style_ref(shape, "fontRef")
    if ref is None:
        return {}
    idx = (ref.get("idx") or "").lower()
    if idx not in {"major", "minor"}:
        return {}

    props = {}
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

    color, _ = self._color_from_fill_elem(ref)
    if color:
        props["color"] = color
    return props

_font_props_from_shape_style_ref.__module__ = 'pptx2html.ir.builder'
_font_props_from_shape_style_ref.__qualname__ = 'PresentationBuilder._font_props_from_shape_style_ref'
