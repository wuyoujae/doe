# Origin: pptx_pipeline.py::_embedded_fonts_use_managed_references
from __future__ import annotations
from doe_export.pipeline.shared import Any

def _embedded_fonts_use_managed_references(presentation_ir: dict[str, Any]) -> bool:
    fonts = presentation_ir.get("embedded_fonts")
    if not isinstance(fonts, list):
        return False
    return all(
        not isinstance(font, dict)
        or not isinstance(font.get("data"), str)
        or font["data"].startswith(
            ("yrkie-asset-data://", "yrkie-asset-base64://")
        )
        for font in fonts
    )

_embedded_fonts_use_managed_references.__module__ = 'pptx_pipeline'
