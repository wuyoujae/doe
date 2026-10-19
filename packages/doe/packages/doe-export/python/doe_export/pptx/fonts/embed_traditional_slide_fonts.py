# Origin: schema_v4_fonts.py::embed_traditional_slide_fonts
from __future__ import annotations
from .shared import Any, BASE_CODEPOINTS, Path
from ._collect_traditional_font_usage import _collect_traditional_font_usage
from ._embed_font_parts import _embed_font_parts
from ._prepare_font_face import _prepare_font_face
from .trusted_traditional_slide_fonts import trusted_traditional_slide_fonts

def embed_traditional_slide_fonts(
    pptx_bytes: bytes,
    presentation: dict[str, Any],
    *,
    frontend_public_root: Path,
) -> bytes:
    usage = _collect_traditional_font_usage(presentation)
    if not usage:
        return pptx_bytes
    trusted = {
        (face.family.casefold(), face.slot): face
        for face in trusted_traditional_slide_fonts(frontend_public_root)
    }
    prepared: list[PreparedFontFace] = []
    for key, codepoints in sorted(usage.items()):
        face = trusted.get(key)
        if face is None:
            continue
        characters = "".join(
            chr(codepoint)
            for codepoint in sorted(BASE_CODEPOINTS.union(codepoints))
        )
        prepared.append(_prepare_font_face(face, characters))
    return _embed_font_parts(pptx_bytes, prepared)

embed_traditional_slide_fonts.__module__ = 'schema_v4_fonts'
