"""Compatibility API for the modular DOE PowerPoint fonts implementation."""
from __future__ import annotations

from doe_export.pptx.fonts.shared import (
    dataclass,
    hashlib,
    BytesIO,
    os,
    posixpath,
    re,
    struct,
    tempfile,
    threading,
    Path,
    Any,
    Iterable,
    ZIP_DEFLATED,
    ZipFile,
    subset,
    TTFont,
    instantiateVariableFont,
    etree,
    FONT_RELATIONSHIP_TYPE,
    FONT_CONTENT_TYPE,
    PML_NS,
    OFFICE_REL_NS,
    PACKAGE_REL_NS,
    CONTENT_TYPES_NS,
    MAX_FONT_SOURCE_BYTES,
    MAX_FONT_SUBSET_BYTES,
    BASE_CODEPOINTS,
    FONT_CACHE_CONTRACT,
    _FONT_CACHE_LOCK,
    TrustedFontFace,
    PreparedFontFace,
    __all__,
)
from doe_export.pptx.fonts.trusted_schema_v4_fonts import trusted_schema_v4_fonts
from doe_export.pptx.fonts.embed_schema_v4_fonts import embed_schema_v4_fonts
from doe_export.pptx.fonts.trusted_traditional_slide_fonts import trusted_traditional_slide_fonts
from doe_export.pptx.fonts.embed_traditional_slide_fonts import embed_traditional_slide_fonts
from doe_export.pptx.fonts._collect_traditional_font_usage import _collect_traditional_font_usage
from doe_export.pptx.fonts._collect_visible_characters import _collect_visible_characters
from doe_export.pptx.fonts._contains_han_text import _contains_han_text
from doe_export.pptx.fonts._prepare_font_face import _prepare_font_face
from doe_export.pptx.fonts._apply_tabular_digits import _apply_tabular_digits
from doe_export.pptx.fonts._rename_font_face import _rename_font_face
from doe_export.pptx.fonts._font_cache_root import _font_cache_root
from doe_export.pptx.fonts._read_cached_font_part import _read_cached_font_part
from doe_export.pptx.fonts._write_cached_font_part import _write_cached_font_part
from doe_export.pptx.fonts._font_metadata import _font_metadata
from doe_export.pptx.fonts._build_eot_font_part import _build_eot_font_part
from doe_export.pptx.fonts._embed_font_parts import _embed_font_parts
from doe_export.pptx.fonts.remove_embedded_fonts import remove_embedded_fonts
from doe_export.pptx.fonts._insert_embedded_font_list import _insert_embedded_font_list
from doe_export.pptx.fonts._relationship_target_part import _relationship_target_part
from doe_export.pptx.fonts._next_number import _next_number
