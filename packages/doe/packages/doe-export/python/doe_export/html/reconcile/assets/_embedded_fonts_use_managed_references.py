# Origin: pptx2html/htmlir/reconcile.py::_embedded_fonts_use_managed_references
from __future__ import annotations
from doe_export.html.reconcile.shared import Any
from doe_export.html.reconcile.assets._managed_asset_id import _managed_asset_id

def _embedded_fonts_use_managed_references(
    presentation_ir: dict[str, Any],
) -> bool:
    fonts = presentation_ir.get("embedded_fonts")
    if not isinstance(fonts, list):
        return False
    return all(
        not isinstance(font, dict)
        or not isinstance(font.get("data"), str)
        or _managed_asset_id(font["data"]) is not None
        for font in fonts
    )

_embedded_fonts_use_managed_references.__module__ = 'pptx2html.htmlir.reconcile'
