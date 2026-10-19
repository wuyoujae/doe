# Origin: pptx2html/ir/builder.py::PresentationBuilder._font_from_props
from __future__ import annotations
from doe_export.ir.importer.shared import Font

@staticmethod
def _font_from_props(props: dict, text: str = "") -> Font:
    from pptx2html.ir.builder import PresentationBuilder
    family = PresentationBuilder._effective_font_family(props, text)
    return Font(
        family=family,
        latin_family=props.get("latin_family"),
        ea_family=props.get("ea_family"),
        cs_family=props.get("cs_family"),
        sym_family=props.get("sym_family"),
        size_pt=props.get("size_pt"),
        bold=props.get("bold", False),
        italic=props.get("italic", False),
        underline=props.get("underline"),
        color=props.get("color"),
        alpha=props.get("alpha"),
        strike=props.get("strike"),
        hyperlink_r_id=props.get("hyperlink_r_id"),
        hyperlink_url=props.get("hyperlink_url"),
        char_spacing_pt=props.get("char_spacing_pt"),
        kerning_pt=props.get("kerning_pt"),
        baseline=props.get("baseline"),
        lang=props.get("lang"),
        alt_lang=props.get("alt_lang"),
        capitalization=props.get("capitalization"),
        highlight=props.get("highlight"),
        normalize_horizontal=props.get("normalize_horizontal"),
        rtl=props.get("rtl"),
        shadow=props.get("shadow"),
    )

_font_from_props.__func__.__module__ = 'pptx2html.ir.builder'
_font_from_props.__func__.__qualname__ = 'PresentationBuilder._font_from_props'
