# Origin: schema_v4_fonts.py::_prepare_font_face
from __future__ import annotations
from .shared import BytesIO, FONT_CACHE_CONTRACT, MAX_FONT_SOURCE_BYTES, MAX_FONT_SUBSET_BYTES, PreparedFontFace, TTFont, TrustedFontFace, hashlib, instantiateVariableFont, subset
from ._apply_tabular_digits import _apply_tabular_digits
from ._build_eot_font_part import _build_eot_font_part
from ._font_metadata import _font_metadata
from ._read_cached_font_part import _read_cached_font_part
from ._rename_font_face import _rename_font_face
from ._write_cached_font_part import _write_cached_font_part

def _prepare_font_face(face: TrustedFontFace, characters: str) -> PreparedFontFace:
    try:
        source = face.path.read_bytes()
    except OSError as error:
        raise ValueError(f"Trusted Schema v4 font is unavailable: {face.path.name}") from error
    if not source or len(source) > MAX_FONT_SOURCE_BYTES:
        raise ValueError(f"Trusted Schema v4 font is invalid: {face.path.name}")
    requested = {ord(character) for character in characters}
    cache_key = hashlib.sha256(
        b"\0".join(
            (
                FONT_CACHE_CONTRACT.encode("ascii"),
                hashlib.sha256(source).hexdigest().encode("ascii"),
                hashlib.sha256(characters.encode("utf-8")).hexdigest().encode("ascii"),
                face.family.encode("utf-8"),
                face.style.encode("ascii"),
                str(face.weight).encode("ascii"),
                face.slot.encode("ascii"),
            )
        )
    ).hexdigest()
    font = TTFont(BytesIO(source), lazy=True, recalcTimestamp=False)
    try:
        metadata = _font_metadata(font)
        if metadata["fs_type"] & 0x0002:
            raise ValueError(f"Font embedding is forbidden for {face.path.name}.")
        if metadata["fs_type"] & 0x0200:
            raise ValueError(f"Bitmap-only font embedding is unsupported for {face.path.name}.")
        internal_families = {
            value.casefold() for value in metadata["families"] if value
        }
        accepted_families = {
            face.family.casefold(),
            *(value.casefold() for value in face.source_families),
        }
        if internal_families.isdisjoint(accepted_families):
            raise ValueError(f"Trusted font family does not match {face.path.name}.")
        cached = _read_cached_font_part(cache_key)
        if cached is not None:
            return PreparedFontFace(
                family=face.family,
                style=face.style,
                weight=face.weight,
                slot=face.slot,
                font_part_bytes=cached,
                panose=bytes(metadata["panose"]).hex().upper(),
                used_codepoints=len(requested),
                missing_codepoints=(),
            )
    finally:
        font.close()

    font = TTFont(BytesIO(source), lazy=False, recalcTimestamp=False)
    try:
        if "fvar" in font:
            weight_axis = next(
                (axis for axis in font["fvar"].axes if axis.axisTag == "wght"),
                None,
            )
            if weight_axis is not None:
                weight = min(
                    float(weight_axis.maxValue),
                    max(float(weight_axis.minValue), float(face.weight)),
                )
                instantiateVariableFont(
                    font,
                    {axis.axisTag: weight if axis.axisTag == "wght" else axis.defaultValue
                     for axis in font["fvar"].axes},
                    inplace=True,
                    optimize=True,
                )
        if face.family.endswith(" Tabular"):
            _apply_tabular_digits(font)
        _rename_font_face(font, face)
        available = set(int(value) for value in (font.getBestCmap() or {}))
        missing = tuple(sorted(requested.difference(available)))
        if metadata["fs_type"] & 0x0100:
            font.flavor = None
        else:
            options = subset.Options()
            options.layout_closure = True
            options.layout_features = ["*"]
            options.hinting = True
            options.recommended_glyphs = True
            options.notdef_glyph = True
            options.notdef_outline = True
            options.glyph_names = True
            options.name_IDs = ["*"]
            options.name_languages = ["*"]
            options.name_legacy = True
            subsetter = subset.Subsetter(options=options)
            subsetter.populate(unicodes=sorted(requested.intersection(available)))
            subsetter.subset(font)
            font.flavor = None
        output = BytesIO()
        font.save(output, reorderTables=True)
        sfnt_bytes = output.getvalue()
    finally:
        font.close()
    if not sfnt_bytes or len(sfnt_bytes) > MAX_FONT_SUBSET_BYTES:
        raise ValueError(f"Schema v4 font subset is too large: {face.path.name}")
    final_font = TTFont(BytesIO(sfnt_bytes), lazy=False, recalcTimestamp=False)
    try:
        final_metadata = _font_metadata(final_font)
    finally:
        final_font.close()
    prepared = PreparedFontFace(
        family=face.family,
        style=face.style,
        weight=face.weight,
        slot=face.slot,
        font_part_bytes=_build_eot_font_part(
            sfnt_bytes,
            final_metadata,
            subsetted=not bool(metadata["fs_type"] & 0x0100),
        ),
        panose=bytes(final_metadata["panose"]).hex().upper(),
        used_codepoints=len(requested),
        missing_codepoints=missing,
    )
    _write_cached_font_part(cache_key, prepared.font_part_bytes)
    return prepared

_prepare_font_face.__module__ = 'schema_v4_fonts'
