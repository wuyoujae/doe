# Origin: pptx2html/ir/builder.py::PresentationBuilder._paragraph_props_from_ppr
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional, emu_to_pt, parse_bool

def _paragraph_props_from_ppr(self, p_pr: Optional[ET.Element]) -> dict:
    if p_pr is None:
        return {}

    props: dict = {}
    if p_pr.get("algn") is not None:
        props["alignment"] = p_pr.get("algn")
    if p_pr.get("marL") is not None:
        props["margin_left"] = emu_to_pt(p_pr.get("marL"))
    if p_pr.get("marR") is not None:
        props["margin_right"] = emu_to_pt(p_pr.get("marR"))
    if p_pr.get("indent") is not None:
        props["indent"] = emu_to_pt(p_pr.get("indent"))
    if p_pr.get("defTabSz") is not None:
        props["default_tab_size"] = emu_to_pt(p_pr.get("defTabSz"))
    if p_pr.get("fontAlgn") is not None:
        props["font_align"] = p_pr.get("fontAlgn")

    for attr, prop_name in (
        ("rtl", "rtl"),
        ("eaLnBrk", "ea_line_break"),
        ("latinLnBrk", "latin_line_break"),
        ("hangingPunct", "hanging_punctuation"),
    ):
        parsed = parse_bool(p_pr.get(attr))
        if parsed is not None:
            props[prop_name] = parsed

    line_spacing = self._line_spacing_info_from_ppr(p_pr)
    if line_spacing:
        props.update(line_spacing)

    before = self._spacing_info_from_ppr(p_pr, "before")
    if before.get("type"):
        props["spacing_before_type"] = before.get("type")
    if before.get("points") is not None:
        props["spacing_before"] = before.get("points")
    if before.get("percent") is not None:
        props["spacing_before_pct"] = before.get("percent")

    after = self._spacing_info_from_ppr(p_pr, "after")
    if after.get("type"):
        props["spacing_after_type"] = after.get("type")
    if after.get("points") is not None:
        props["spacing_after"] = after.get("points")
    if after.get("percent") is not None:
        props["spacing_after_pct"] = after.get("percent")

    tab_stops = self._tab_stops_from_ppr(p_pr)
    if tab_stops:
        props["tab_stops"] = tab_stops

    bullet = self._bullet_from_ppr(p_pr)
    if bullet is not None:
        props["bullet"] = bullet

    return props

_paragraph_props_from_ppr.__module__ = 'pptx2html.ir.builder'
_paragraph_props_from_ppr.__qualname__ = 'PresentationBuilder._paragraph_props_from_ppr'
