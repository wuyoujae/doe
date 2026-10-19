# Origin: pptx_pipeline.py::export_ir_to_html
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import CanonicalHtmlRenderer, presentation_from_dict
from doe_export.pipeline.text_layout._presentation_ir_with_legacy_layout_dirty import _presentation_ir_with_legacy_layout_dirty
from doe_export.pipeline.presentation._static_export_watermark_style import _static_export_watermark_style
from doe_export.pipeline.assets._validate_rendered_html_resources import _validate_rendered_html_resources
from doe_export.pipeline.assets._validate_self_contained_presentation_resources import _validate_self_contained_presentation_resources

def export_ir_to_html(
    presentation_ir: dict[str, Any],
    *,
    export_watermark: bool = False,
    max_output_bytes: int | None = None,
) -> bytes:
    """Export a self-contained, multi-slide canonical HTML document."""

    if not isinstance(presentation_ir, dict):
        raise ValueError("PresentationIR object is required.")
    _validate_self_contained_presentation_resources(presentation_ir)
    presentation = presentation_from_dict(
        _presentation_ir_with_legacy_layout_dirty(presentation_ir)
    )
    if not presentation.slides:
        raise ValueError("PresentationIR must contain at least one slide.")
    if len(presentation.slides) > 300:
        raise ValueError("A presentation cannot contain more than 300 slides.")
    html = CanonicalHtmlRenderer(mode="embedded").render(presentation)
    if export_watermark:
        html = html.replace(
            "</head>",
            f"{_static_export_watermark_style()}</head>",
            1,
        )
    if "yrkie-asset-data://" in html or "yrkie-asset-base64://" in html:
        raise ValueError(
            "PresentationIR contains unresolved asset references; HTML export "
            "requires hydrated assets."
        )
    _validate_rendered_html_resources(html)
    payload = html.encode("utf-8")
    if max_output_bytes is not None and len(payload) > max_output_bytes:
        raise ValueError(
            f"Canonical HTML cannot exceed {max_output_bytes} bytes."
        )
    return payload

export_ir_to_html.__module__ = 'pptx_pipeline'
