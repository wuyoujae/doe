# Origin: schema_v4_fonts.py::_collect_traditional_font_usage
from __future__ import annotations
from .shared import Any

def _collect_traditional_font_usage(
    presentation: dict[str, Any],
) -> dict[tuple[str, str], set[int]]:
    trusted_families = {"fraunces", "outfit", "manrope", "lora", "tomorrow", "zcool qingke huangyou", "eb garamond", "ibm plex mono", "fredoka", "caveat"}
    usage: dict[tuple[str, str], set[int]] = {}

    def visit(value: Any) -> None:
        if isinstance(value, (list, tuple)):
            for item in value:
                visit(item)
            return
        if not isinstance(value, dict):
            return
        text = value.get("text")
        font = value.get("font")
        if isinstance(text, str) and isinstance(font, dict):
            family = str(
                font.get("family")
                or font.get("latin_family")
                or ""
            ).strip()
            family_key = family.casefold()
            if family_key in trusted_families:
                bold = font.get("bold") is True
                italic = font.get("italic") is True
                # These display families have no italic face. Embed the matching
                # upright source; the existing italic run flag requests synthesis.
                if family_key in {"fredoka", "caveat"}:
                    italic = False
                slot = (
                    "boldItalic"
                    if bold and italic
                    else "bold"
                    if bold
                    else "italic"
                    if italic
                    else "regular"
                )
                codepoints = usage.setdefault((family_key, slot), set())
                codepoints.update(
                    ord(character)
                    for character in text
                    if not 0xD800 <= ord(character) <= 0xDFFF
                )
        for child in value.values():
            if isinstance(child, (dict, list, tuple)):
                visit(child)

    visit(presentation)
    return usage

_collect_traditional_font_usage.__module__ = 'schema_v4_fonts'
