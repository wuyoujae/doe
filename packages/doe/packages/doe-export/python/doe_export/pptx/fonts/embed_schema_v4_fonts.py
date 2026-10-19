# Origin: schema_v4_fonts.py::embed_schema_v4_fonts
from __future__ import annotations
from .shared import Any, Iterable, Path
from ._collect_visible_characters import _collect_visible_characters
from ._embed_font_parts import _embed_font_parts
from ._prepare_font_face import _prepare_font_face
from .trusted_schema_v4_fonts import trusted_schema_v4_fonts

def embed_schema_v4_fonts(
    pptx_bytes: bytes,
    presentation: dict[str, Any],
    native_components_by_slide: Iterable[Iterable[dict[str, Any]]],
    *,
    renderer_root: Path,
) -> bytes:
    characters, used_faces = _collect_visible_characters(
        presentation,
        native_components_by_slide=native_components_by_slide,
    )
    prepared = [
        _prepare_font_face(face, characters)
        for face in trusted_schema_v4_fonts(renderer_root)
        if (face.family.casefold(), face.slot) in used_faces
    ]
    return _embed_font_parts(pptx_bytes, prepared)

embed_schema_v4_fonts.__module__ = 'schema_v4_fonts'
