# Origin: pptx_pipeline.py::_normalized_asset_content_type
from __future__ import annotations
from doe_export.pipeline.shared import font_content_type_from_magic

def _normalized_asset_content_type(content_type: str, raw: bytes) -> str:
    normalized = str(content_type or "application/octet-stream").strip().lower()
    detected_font_type = font_content_type_from_magic(raw)
    if detected_font_type is not None and (
        normalized.startswith("font/")
        or normalized in {
            "application/octet-stream",
            "application/x-font-ttf",
            "application/x-font-opentype",
        }
    ):
        return detected_font_type
    return normalized

_normalized_asset_content_type.__module__ = 'pptx_pipeline'
