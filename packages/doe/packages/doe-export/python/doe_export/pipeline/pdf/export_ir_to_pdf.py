# Origin: pptx_pipeline.py::export_ir_to_pdf
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import CanonicalHtmlRenderer, math, print_html_to_pdf
from doe_export.pipeline.presentation._presentation_for_static_export import _presentation_for_static_export
from doe_export.pipeline.html._static_export_html import _static_export_html

def export_ir_to_pdf(
    presentation_ir: dict[str, Any],
    *,
    export_watermark: bool = False,
) -> bytes:
    """Render a complete PresentationIR deck to a presentation-sized PDF."""

    presentation = _presentation_for_static_export(presentation_ir)
    page_width_pt = float(presentation.width)
    page_height_pt = float(presentation.height)
    if (
        not math.isfinite(page_width_pt)
        or not math.isfinite(page_height_pt)
        or not 1.0 <= page_width_pt <= 14_400.0
        or not 1.0 <= page_height_pt <= 14_400.0
    ):
        raise ValueError("Presentation page size must be between 1 and 14400 points.")
    html = _static_export_html(
        CanonicalHtmlRenderer(mode="embedded").render(
            presentation,
            preserve_page_size=True,
        ),
        export_watermark=export_watermark,
        page_width_pt=page_width_pt,
        page_height_pt=page_height_pt,
    )
    payload = print_html_to_pdf(
        html,
        page_width_pt=page_width_pt,
        page_height_pt=page_height_pt,
        timeout_ms=120000,
    )
    if not payload.startswith(b"%PDF-"):
        raise ValueError("Chromium returned an invalid PDF file.")
    return payload

export_ir_to_pdf.__module__ = 'pptx_pipeline'
