# Origin: schema_v4_export.py::render_schema_v4_thumbnail
from __future__ import annotations
from .shared import Any, Image, MAX_SLIDES, MAX_THUMBNAIL_BYTES, SchemaV4ExportError, THUMBNAIL_HEIGHT_PX, THUMBNAIL_WIDTH_PX, io
from ._decode_slide_screenshot import _decode_slide_screenshot
from ._render_schema_deck import _render_schema_deck
from ._validate_deck import _validate_deck

def render_schema_v4_thumbnail(
    deck: dict[str, Any],
    *,
    assets: dict[str, Any] | None = None,
    total_slides: int | None = None,
    timeout_seconds: int = 90,
) -> bytes:
    slides = _validate_deck(deck)
    resolved_total = len(slides) if total_slides is None else total_slides
    if not isinstance(resolved_total, int) or resolved_total < len(slides) or resolved_total > MAX_SLIDES:
        raise SchemaV4ExportError(
            f"Schema Deck total_slides must be between {len(slides)} and {MAX_SLIDES}."
        )
    rendered = _render_schema_deck(
        deck,
        assets if isinstance(assets, dict) else {},
        timeout_seconds=timeout_seconds,
        include_screenshots=True,
        include_stylesheet=False,
        slide_indices=[0],
        total_slides=resolved_total,
    )
    rendered_slides = rendered.get("slides")
    if not isinstance(rendered_slides, list) or len(rendered_slides) != 1:
        raise SchemaV4ExportError("Schema v4 renderer returned no cover Slide.")
    screenshot = _decode_slide_screenshot(
        rendered_slides[0].get("screenshot_png_base64"),
        1,
    )
    output = io.BytesIO()
    with Image.open(io.BytesIO(screenshot)) as image:
        image.convert("RGB").resize(
            (THUMBNAIL_WIDTH_PX, THUMBNAIL_HEIGHT_PX),
            Image.Resampling.LANCZOS,
        ).save(output, format="WEBP", quality=82, method=4)
    thumbnail = output.getvalue()
    if not thumbnail or len(thumbnail) > MAX_THUMBNAIL_BYTES:
        raise SchemaV4ExportError("Schema v4 thumbnail is too large.")
    return thumbnail

render_schema_v4_thumbnail.__module__ = 'schema_v4_export'
