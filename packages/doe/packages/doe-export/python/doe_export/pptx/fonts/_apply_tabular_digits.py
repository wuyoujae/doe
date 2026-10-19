# Origin: schema_v4_fonts.py::_apply_tabular_digits
from __future__ import annotations
from .shared import TTFont

def _apply_tabular_digits(font: TTFont) -> None:
    """Bake tnum into a dedicated face because DrawingML has no tnum run switch."""
    gsub = font["GSUB"].table
    substitutions = {}
    for feature in gsub.FeatureList.FeatureRecord:
        if feature.FeatureTag != "tnum":
            continue
        for index in feature.Feature.LookupListIndex:
            lookup = gsub.LookupList.Lookup[index]
            for subtable in lookup.SubTable:
                if lookup.LookupType != 1:
                    raise ValueError("Trusted tabular font has an unsupported substitution.")
                substitutions.update(subtable.mapping)
    if not substitutions:
        raise ValueError("Trusted tabular font has no tnum substitution.")
    for table in font["cmap"].tables:
        if table.isUnicode():
            table.cmap = {code: substitutions.get(glyph, glyph) for code, glyph in table.cmap.items()}

_apply_tabular_digits.__module__ = 'schema_v4_fonts'
