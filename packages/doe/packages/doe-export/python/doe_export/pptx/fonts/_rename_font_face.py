# Origin: schema_v4_fonts.py::_rename_font_face
from __future__ import annotations
from .shared import TTFont, TrustedFontFace, re

def _rename_font_face(font: TTFont, face: TrustedFontFace) -> None:
    subfamily = (
        "Bold Italic"
        if face.slot == "boldItalic"
        else "Bold"
        if face.slot == "bold"
        else "Italic"
        if face.slot == "italic"
        else "Regular"
    )
    full_name = face.family if subfamily == "Regular" else f"{face.family} {subfamily}"
    postscript_name = re.sub(r"[^A-Za-z0-9-]", "", f"{face.family}-{subfamily.replace(' ', '')}")
    name_table = font["name"]
    replacements = {
        1: face.family,
        2: subfamily,
        4: full_name,
        6: postscript_name,
        16: face.family,
        17: subfamily,
        21: face.family,
        22: subfamily,
    }
    records = list(name_table.names)
    for name_id, value in replacements.items():
        targets = [record for record in records if record.nameID == name_id]
        if not targets:
            name_table.setName(value, name_id, 3, 1, 0x0409)
            continue
        for record in targets:
            name_table.setName(
                value,
                name_id,
                record.platformID,
                record.platEncID,
                record.langID,
            )

    bold = face.weight >= 600
    italic = face.style == "italic"
    if "OS/2" in font:
        os2 = font["OS/2"]
        os2.usWeightClass = int(face.weight)
        os2.fsSelection &= ~((1 << 0) | (1 << 5) | (1 << 6))
        if italic:
            os2.fsSelection |= 1 << 0
        if bold:
            os2.fsSelection |= 1 << 5
        if not bold and not italic:
            os2.fsSelection |= 1 << 6
    if "head" in font:
        font["head"].macStyle &= ~0x03
        if bold:
            font["head"].macStyle |= 0x01
        if italic:
            font["head"].macStyle |= 0x02

_rename_font_face.__module__ = 'schema_v4_fonts'
