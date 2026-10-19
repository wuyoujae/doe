# Origin: pptx2html/server/ooxml_pptx_writer.py::_safe_roundtrip_source_indexes
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.package.RoundtripFallbackRequired import RoundtripFallbackRequired

def _safe_roundtrip_source_indexes(
    slides: list[dict[str, Any]],
    original_slides: list[dict[str, Any]],
    source_slide_count: int,
) -> list[int | None]:
    if len(original_slides) != source_slide_count:
        raise RoundtripFallbackRequired(
            "Source-backed PPTX export requires complete original slide provenance"
        )

    has_source_provenance = any(
        "_yrkie_source_slide_index" in slide for slide in slides
    )
    if not has_source_provenance:
        if len(slides) != source_slide_count:
            raise RoundtripFallbackRequired(
                "Source-backed PPTX export requires unchanged slide structure"
            )
        return list(range(source_slide_count))

    source_indexes: list[int | None] = []
    for slide in slides:
        value = slide.get("_yrkie_source_slide_index")
        if value is None:
            source_indexes.append(None)
        elif isinstance(value, int) and not isinstance(value, bool):
            source_indexes.append(value)
        else:
            raise RoundtripFallbackRequired(
                "Source-backed PPTX export received invalid slide provenance"
            )
    imported_indexes = [index for index in source_indexes if index is not None]
    if imported_indexes != list(range(source_slide_count)):
        raise RoundtripFallbackRequired(
            "Source-backed PPTX export requires every imported slide in its original order"
        )
    return source_indexes

_safe_roundtrip_source_indexes.__module__ = 'pptx2html.server.ooxml_pptx_writer'
