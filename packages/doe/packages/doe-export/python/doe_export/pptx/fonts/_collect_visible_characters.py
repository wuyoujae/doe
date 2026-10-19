# Origin: schema_v4_fonts.py::_collect_visible_characters
from __future__ import annotations
from .shared import Any, BASE_CODEPOINTS, Iterable
from ._contains_han_text import _contains_han_text

def _collect_visible_characters(
    presentation: dict[str, Any],
    *,
    native_components_by_slide: Iterable[Iterable[dict[str, Any]]],
) -> tuple[str, set[tuple[str, str]]]:
    codepoints = set(BASE_CODEPOINTS)
    used_faces: set[tuple[str, str]] = set()
    trusted_families = {
        "infaxiswield humanist",
        "misans",
        "misans medium",
        "alexandria",
        "alexandria medium",
        "alexandria tabular",
        "alexandria medium tabular",
    }

    def add_text(value: Any) -> None:
        if not isinstance(value, str):
            return
        for character in value:
            codepoint = ord(character)
            if not 0xD800 <= codepoint <= 0xDFFF:
                codepoints.add(codepoint)

    def visit_ir(value: Any) -> None:
        if isinstance(value, (list, tuple)):
            for item in value:
                visit_ir(item)
            return
        if not isinstance(value, dict):
            return
        font = value.get("font")
        if isinstance(font, dict):
            families = {
                str(font.get(key) or "").strip().casefold()
                for key in ("family", "latin_family", "ea_family", "cs_family")
            }
            italic = font.get("italic") is True
            bold = font.get("bold") is True
            try:
                bold = bold or int(font.get("weight") or 400) >= 600
            except (TypeError, ValueError):
                pass
            for family in families.intersection(trusted_families):
                if family in {"misans", "misans medium", "alexandria", "alexandria medium", "alexandria tabular", "alexandria medium tabular"}:
                    slot = "bold" if bold else "regular"
                else:
                    slot = "italic" if italic else "bold" if bold else "regular"
                used_faces.add((family, slot))
        runs = value.get("runs")
        if isinstance(runs, list):
            for run in runs:
                if isinstance(run, dict):
                    add_text(run.get("text"))
        if isinstance(value.get("text"), str) and any(
            key in value
            for key in ("colspan", "rowspan", "h_merge", "v_merge", "text_frame")
        ):
            add_text(value.get("text"))
        bullet = value.get("bullet")
        if isinstance(bullet, dict):
            add_text(bullet.get("char"))
        formula = value.get("formula")
        if isinstance(formula, dict):
            add_text(formula.get("fallback_text") or formula.get("source"))
        chart = value.get("chart")
        if isinstance(chart, dict):
            add_text(chart.get("title"))
            for series in chart.get("series") or []:
                if not isinstance(series, dict):
                    continue
                add_text(series.get("name"))
                for item in series.get("categories") or []:
                    add_text(item)
        for child in value.values():
            if isinstance(child, (dict, list, tuple)):
                visit_ir(child)

    def visit_native(value: Any) -> None:
        if isinstance(value, (list, tuple)):
            for item in value:
                visit_native(item)
            return
        if not isinstance(value, dict):
            return
        if str(value.get("type") or "").endswith("-chart"):
            family = "misans" if _contains_han_text(value) else "alexandria"
            used_faces.update(((family, "regular"), (f"{family} medium", "regular")))
        for key, item in value.items():
            if key in {
                "title",
                "subtitle",
                "name",
                "label",
                "text",
                "fallbackText",
                "valuePrefix",
                "valueSuffix",
            }:
                add_text(item)
            elif isinstance(item, (dict, list, tuple)):
                visit_native(item)

    visit_ir(presentation)
    for components in native_components_by_slide:
        visit_native(components)
    return (
        "".join(chr(codepoint) for codepoint in sorted(codepoints)),
        used_faces,
    )

_collect_visible_characters.__module__ = 'schema_v4_fonts'
