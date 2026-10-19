# Origin: pptx_pipeline.py::import_pptx_to_canonical
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import BytesIO, COPYIST_PARSER_VERSION, CanonicalHtmlRenderer, PomPresentation, PresentationBuilder, dataclasses, hashlib
from doe_export.pipeline.assets._externalize_canonical_assets import _externalize_canonical_assets
from doe_export.pipeline.pptx._validate_pptx_package import _validate_pptx_package
from doe_export.pipeline.html.extract_editable_slide_html import extract_editable_slide_html

def import_pptx_to_canonical(pptx_bytes: bytes) -> dict[str, Any]:
    """Parse PPTX bytes once and emit one lossless canonical HTML document per slide."""

    if not isinstance(pptx_bytes, bytes) or not pptx_bytes:
        raise ValueError("PPTX bytes are required.")
    if not pptx_bytes.startswith(b"PK"):
        raise ValueError("The uploaded file is not an OOXML ZIP package.")
    _validate_pptx_package(pptx_bytes)

    with PomPresentation.open(BytesIO(pptx_bytes)) as pom:
        presentation = PresentationBuilder().build(pom)
    if not presentation.slides:
        raise ValueError("The presentation contains no slides.")
    if len(presentation.slides) > 300:
        raise ValueError("A presentation cannot contain more than 300 slides.")

    original_ir = dataclasses.asdict(presentation)
    renderer = CanonicalHtmlRenderer(mode="embedded")
    slides: list[dict[str, Any]] = []
    assets: dict[str, dict[str, Any]] = {}
    for index, slide in enumerate(presentation.slides):
        one_slide = dataclasses.replace(presentation, slides=[slide])
        resource_diagnostics: list[dict[str, str]] = []
        html = _externalize_canonical_assets(
            renderer.render(one_slide),
            assets,
            diagnostics=resource_diagnostics,
        )
        editable = extract_editable_slide_html(
            html,
            known_asset_ids=set(assets),
        )
        slides.append(
            {
                "index": index,
                "title": slide.name or f"Slide {index + 1}",
                "html": html,
                "content_hash": hashlib.sha256(html.encode("utf-8")).hexdigest(),
                "editable_html": editable["editable_html"],
                "editable_html_sha256": editable["editable_html_sha256"],
                "canonical_ir_valid": editable["canonical_ir_valid"],
                "current_ir_sha256": editable["current_ir_sha256"],
                "resource_diagnostics": resource_diagnostics,
                "shape_count": len(slide.shapes),
            }
        )

    return {
        "success": True,
        "parser_version": COPYIST_PARSER_VERSION,
        "source_sha256": hashlib.sha256(pptx_bytes).hexdigest(),
        "slide_count": len(slides),
        "width": presentation.width,
        "height": presentation.height,
        "presentation": original_ir,
        "slides": slides,
        "assets": list(assets.values()),
    }

import_pptx_to_canonical.__module__ = 'pptx_pipeline'
