# Origin: pptx2html/ir/builder.py::PresentationBuilder._font_props_from_rpr
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional, parse_bool, percentage_to_float

def _font_props_from_rpr(
    self, r_pr: Optional[ET.Element], relationship_owner: object | None = None
) -> dict:
    if r_pr is None:
        return {}

    _A = NAMESPACE.DML_MAIN
    props = {}

    families = self._font_families_from_rpr(r_pr)
    families = {
        key: self._resolve_theme_font(value)
        for key, value in families.items()
    }
    props.update(families)
    family = (
        families.get("latin_family")
        or families.get("ea_family")
        or families.get("cs_family")
        or families.get("sym_family")
    )
    if family:
        props["family"] = family

    size = r_pr.get("sz")
    if size is not None:
        try:
            props["size_pt"] = int(size) / 100.0
        except (ValueError, TypeError):
            pass

    bold = parse_bool(r_pr.get("b"))
    if bold is not None:
        props["bold"] = bold
    italic = parse_bool(r_pr.get("i"))
    if italic is not None:
        props["italic"] = italic

    underline = r_pr.get("u")
    if underline is not None:
        props["underline"] = underline

    for attr, prop_name in (
        ("lang", "lang"),
        ("altLang", "alt_lang"),
        ("cap", "capitalization"),
    ):
        val = r_pr.get(attr)
        if val is not None:
            props[prop_name] = val

    normalize_h = parse_bool(r_pr.get("normalizeH"))
    if normalize_h is not None:
        props["normalize_horizontal"] = normalize_h

    rtl = parse_bool(r_pr.get("rtl"))
    if rtl is not None:
        props["rtl"] = rtl

    strike = r_pr.get("strike")
    if strike is not None:
        props["strike"] = None if strike == "noStrike" else strike

    char_spacing = self._centipoints_to_pt(r_pr.get("spc"))
    if char_spacing is not None:
        props["char_spacing_pt"] = char_spacing

    kerning = self._centipoints_to_pt(r_pr.get("kern"))
    if kerning is not None:
        props["kerning_pt"] = kerning

    baseline = percentage_to_float(r_pr.get("baseline"))
    if baseline is not None:
        props["baseline"] = baseline

    shadow = self._parse_shadow(r_pr)
    if shadow is not None:
        props["shadow"] = shadow

    solid_fill = r_pr.find(f"{{{_A}}}solidFill")
    if solid_fill is not None:
        color, alpha = self._color_from_fill_elem(solid_fill)
        if color:
            props["color"] = color
        if alpha is not None:
            props["alpha"] = alpha
    else:
        color, alpha = self._color_from_fill_elem(r_pr)
        if color:
            props["color"] = color
        if alpha is not None:
            props["alpha"] = alpha

    highlight = r_pr.find(f"{{{_A}}}highlight")
    if highlight is not None:
        srgb = highlight.find(f"{{{_A}}}srgbClr")
        if srgb is not None:
            color = self._resolve_color(srgb.get("val"))
            if color:
                props["highlight"] = color
        if "highlight" not in props:
            scheme = highlight.find(f"{{{_A}}}schemeClr")
            if scheme is not None:
                color = self._resolve_color(scheme.get("val"))
                if color:
                    props["highlight"] = color

    hlink = r_pr.find(f"{{{_A}}}hlinkClick")
    if hlink is not None:
        rel_id = hlink.get(f"{{{NAMESPACE.OFC_RELATIONSHIPS}}}id")
        if rel_id:
            props["hyperlink_r_id"] = rel_id
            target = self._relationship_target_by_id(relationship_owner, rel_id)
            if target:
                props["hyperlink_url"] = target

    return props

_font_props_from_rpr.__module__ = 'pptx2html.ir.builder'
_font_props_from_rpr.__qualname__ = 'PresentationBuilder._font_props_from_rpr'
