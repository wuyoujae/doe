# Origin: pptx_pipeline.py::render_ir_preview_png
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import CanonicalHtmlRenderer, capture_html_screenshots, dataclasses, math
from doe_export.pipeline.presentation._presentation_for_static_export import _presentation_for_static_export
from doe_export.pipeline.html._static_export_html import _static_export_html

def render_ir_preview_png(
    presentation_ir: dict[str, Any],
    *,
    slide_index: int = 0,
) -> bytes:
    """Render one slide from the authoritative PresentationIR for UI previews."""

    presentation = _presentation_for_static_export(presentation_ir)
    if slide_index < 0 or slide_index >= len(presentation.slides):
        raise ValueError("Preview slide index is outside the presentation.")
    page_width_pt = float(presentation.width)
    page_height_pt = float(presentation.height)
    if (
        not math.isfinite(page_width_pt)
        or not math.isfinite(page_height_pt)
        or page_width_pt <= 0.0
        or page_height_pt <= 0.0
    ):
        raise ValueError("Presentation page size must contain positive finite dimensions.")

    # 96 CSS pixels per inch / 72 points per inch preserves the IR coordinate
    # scale for ordinary presentations. Cap unusually large canvases while
    # retaining their aspect ratio because the caller only needs a thumbnail.
    css_scale = min(4.0 / 3.0, 1440.0 / max(page_width_pt, page_height_pt))
    viewport = (
        max(1, round(page_width_pt * css_scale)),
        max(1, round(page_height_pt * css_scale)),
    )
    one_slide = dataclasses.replace(
        presentation,
        slides=[presentation.slides[slide_index]],
    )
    source = _static_export_html(
        CanonicalHtmlRenderer(mode="embedded").render(
            one_slide,
            preserve_page_size=True,
        ),
        page_width_pt=page_width_pt,
        page_height_pt=page_height_pt,
        screen_viewport=viewport,
    )
    screenshots = capture_html_screenshots(
        [{"id": str(slide_index), "source": source}],
        viewport=viewport,
        device_scale_factor=1.0,
        timeout_ms=45_000,
        concurrency=1,
    )
    preview = screenshots[0]
    if not preview.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError("Slide preview renderer returned an invalid PNG file.")
    return preview

render_ir_preview_png.__module__ = 'pptx_pipeline'
