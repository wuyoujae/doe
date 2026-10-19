# Origin: pptx2html/htmlir/compiler.py::_font_from_computed
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Font
from doe_export.html.compiler.typography._background_clip_text_color import _background_clip_text_color
from doe_export.html.compiler.css._css_color import _css_color
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.typography._css_font_variant_caps import _css_font_variant_caps
from doe_export.html.compiler.css._css_kerning_pt import _css_kerning_pt
from doe_export.html.compiler.css._css_letter_spacing_pt import _css_letter_spacing_pt
from doe_export.html.compiler.css._css_rtl import _css_rtl
from doe_export.html.compiler.css._css_word_spacing_pt import _css_word_spacing_pt
from doe_export.html.compiler.typography._resolved_font_family import _resolved_font_family
from doe_export.html.compiler.typography._strike_from_text_decoration_style import _strike_from_text_decoration_style
from doe_export.html.compiler.typography._text_decoration_color import _text_decoration_color
from doe_export.html.compiler.typography._text_decoration_lines import _text_decoration_lines
from doe_export.html.compiler.typography._text_decoration_style import _text_decoration_style
from doe_export.html.compiler.typography._text_decoration_thickness_pt import _text_decoration_thickness_pt
from doe_export.html.compiler.typography._text_shadow_from_computed import _text_shadow_from_computed
from doe_export.html.compiler.typography._underline_from_text_decoration_style import _underline_from_text_decoration_style

def _font_from_computed(
    computed: dict[str, Any],
    font_size_pt: float,
    opacity: float,
    visual_scale: float = 1.0,
    text_decoration_overlay: bool = False,
) -> Font:
    color = (
        _background_clip_text_color(computed)
        or _css_color(computed.get("color"))
        or ("000000", 1.0)
    )
    alpha = color[1] * opacity
    weight = str(computed.get("fontWeight") or "").lower()
    numeric_weight = _css_float(weight, 400)
    decoration_lines = _text_decoration_lines(computed)
    decoration_style = _text_decoration_style(computed.get("textDecorationStyle"))
    decoration_width_pt = _text_decoration_thickness_pt(computed, font_size_pt)
    decoration_color, decoration_alpha = _text_decoration_color(computed, opacity)
    underline = (
        _underline_from_text_decoration_style(decoration_style, decoration_width_pt)
        if "underline" in decoration_lines
        else None
    )
    strike = _strike_from_text_decoration_style(decoration_style) if "line-through" in decoration_lines else None
    style = str(computed.get("fontStyle") or "").lower()
    family = _resolved_font_family(computed)
    italic = "italic" in style or "oblique" in style
    # DOE's bundled families have upright faces only; CSS can disable faux italics.
    if str(computed.get("fontSynthesis") or "") == "none" and family in {
        "Alexandria", "Alexandria Medium", "MiSans", "MiSans Medium",
    }:
        italic = False
    if family in {"Alexandria", "Alexandria Medium"} and "tabular-nums" in str(computed.get("fontVariantNumeric") or ""):
        family += " Tabular"
    return Font(
        family=family,
        latin_family=family,
        ea_family=family,
        cs_family=family,
        sym_family=family,
        size_pt=round(font_size_pt, 3),
        bold=weight in {"bold", "bolder"} or numeric_weight >= 600,
        italic=italic,
        underline=underline,
        underline_color=decoration_color if underline else None,
        underline_alpha=decoration_alpha if underline and decoration_alpha < 0.999 else None,
        underline_width_pt=decoration_width_pt if underline else None,
        strike=strike,
        strike_color=decoration_color if strike else None,
        strike_alpha=decoration_alpha if strike and decoration_alpha < 0.999 else None,
        strike_width_pt=decoration_width_pt if strike else None,
        strike_style=decoration_style if strike else None,
        text_decoration_overlay=text_decoration_overlay and bool(underline or strike),
        color=color[0],
        alpha=alpha if alpha < 0.999 else None,
        char_spacing_pt=_css_letter_spacing_pt(computed, visual_scale),
        word_spacing_pt=_css_word_spacing_pt(computed, visual_scale),
        kerning_pt=_css_kerning_pt(computed),
        capitalization=_css_font_variant_caps(computed),
        rtl=_css_rtl(computed),
        shadow=_text_shadow_from_computed(computed, visual_scale, opacity),
    )

_font_from_computed.__module__ = 'pptx2html.htmlir.compiler'
