from __future__ import annotations

import base64
import binascii
from typing import Any

from doe_export.pptx.schema._render_schema_deck import _render_schema_deck
from doe_export.pptx.schema._validate_deck import _validate_deck
from doe_export.pptx.schema.shared import SchemaV4ExportError
from pptx2html.server.export_watermark import export_watermark_data_uri

PDF_CONTRACT = "yrkie-doe-schema-pdf-v1"


def export_schema_v4_deck_to_pdf(
    deck: dict[str, Any], *, assets: dict[str, Any] | None = None,
    export_watermark: bool = False, timeout_seconds: int = 900,
) -> bytes:
    slides = _validate_deck(deck)
    if type(export_watermark) is not bool:
        raise SchemaV4ExportError("PDF watermark must be a boolean.")
    for slide in slides:
        size = slide.get("size", {"width": 960, "height": 540, "unit": "pt"})
        if not isinstance(size, dict) or size.get("width") != 960 or size.get("height") != 540 or size.get("unit", "pt") != "pt":
            raise SchemaV4ExportError("DOE PDF requires 960 by 540 point presentation pages.")
    result = _render_schema_deck(
        deck, assets or {}, timeout_seconds=timeout_seconds,
        include_screenshots=False, include_stylesheet=False, output_format="pdf",
        watermark_data_uri=export_watermark_data_uri() if export_watermark else None,
    )
    if result.get("pdf_contract") != PDF_CONTRACT or result.get("slide_count") != len(slides):
        raise SchemaV4ExportError("PDF renderer returned an incomplete presentation.")
    try:
        data = base64.b64decode(result.get("pdf_base64", ""), validate=True)
    except (ValueError, TypeError, binascii.Error) as error:
        raise SchemaV4ExportError("PDF renderer returned invalid data.") from error
    if not data.startswith(b"%PDF-") or not data.rstrip().endswith(b"%%EOF") or len(data) > 128 * 1024 * 1024:
        raise SchemaV4ExportError("PDF renderer returned an invalid or oversized document.")
    return data
