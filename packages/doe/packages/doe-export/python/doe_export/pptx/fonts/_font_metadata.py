# Origin: schema_v4_fonts.py::_font_metadata
from __future__ import annotations
from .shared import Any, TTFont

def _font_metadata(font: TTFont) -> dict[str, Any]:
    name_table = font["name"]

    def names(name_ids: tuple[int, ...]) -> list[str]:
        values: list[str] = []
        for name_id in name_ids:
            records = [record for record in name_table.names if record.nameID == name_id]
            records.sort(key=lambda record: (record.platformID != 3, record.langID != 0x409))
            for record in records:
                try:
                    value = record.toUnicode().strip().strip("\x00")
                except Exception:
                    continue
                if value and value not in values:
                    values.append(value)
            if values:
                break
        return values

    families = names((16, 1))
    styles = names((17, 2))
    versions = names((5,))
    full_names = names((4,))
    family = families[0] if families else "Unknown"
    style = styles[0] if styles else "Regular"
    os2 = font["OS/2"]
    head = font["head"]
    post = font.get("post")
    panose_fields = (
        "bFamilyType",
        "bSerifStyle",
        "bWeight",
        "bProportion",
        "bContrast",
        "bStrokeVariation",
        "bArmStyle",
        "bLetterForm",
        "bMidline",
        "bXHeight",
    )
    panose_object = getattr(os2, "panose", None)
    panose = bytes(
        int(getattr(panose_object, field, 0)) & 0xFF for field in panose_fields
    )
    italic = bool(getattr(post, "italicAngle", 0)) or bool(
        getattr(os2, "fsSelection", 0) & 0x01
    )
    return {
        "family": family,
        "families": families or [family],
        "style": style,
        "version_name": versions[0] if versions else "Version 1.0",
        "full_name": full_names[0] if full_names else f"{family} {style}".strip(),
        "panose": panose,
        "italic": italic,
        "weight": int(getattr(os2, "usWeightClass", 400) or 400),
        "fs_type": int(getattr(os2, "fsType", 0) or 0),
        "unicode_ranges": tuple(
            int(getattr(os2, f"ulUnicodeRange{index}", 0) or 0)
            for index in range(1, 5)
        ),
        "codepage_ranges": tuple(
            int(getattr(os2, f"ulCodePageRange{index}", 0) or 0)
            for index in range(1, 3)
        ),
        "checksum_adjustment": int(getattr(head, "checkSumAdjustment", 0) or 0),
    }

_font_metadata.__module__ = 'schema_v4_fonts'
