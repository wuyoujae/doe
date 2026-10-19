# Origin: schema_v4_export.py::export_schema_v4_deck_to_pptx
from __future__ import annotations
from .shared import Any, SchemaV4ExportError
from ._export_editable_pptx import _export_editable_pptx
from ._export_visual_fidelity_pptx import _export_visual_fidelity_pptx
from ._render_schema_deck import _render_schema_deck
from ._validate_deck import _validate_deck

def export_schema_v4_deck_to_pptx(
    deck: dict[str, Any],
    *,
    assets: dict[str, Any] | None = None,
    export_watermark: bool = False,
    embed_fonts: bool = True,
    timeout_seconds: int = 240,
    output_mode: str = "editable",
    flow_layout: dict[str, Any] | None = None,
) -> bytes:
    normalized_output_mode = str(output_mode).strip().lower()
    if normalized_output_mode not in {"visual", "editable"}:
        raise SchemaV4ExportError(
            "Schema v4 output_mode must be either 'visual' or 'editable'."
        )
    slides = _validate_deck(deck)
    rendered = _render_schema_deck(
        deck,
        assets if isinstance(assets, dict) else {},
        timeout_seconds=timeout_seconds,
        include_screenshots=normalized_output_mode == "visual",
        include_stylesheet=normalized_output_mode == "editable",
        **({"flow_layout": flow_layout} if flow_layout is not None else {}),
    )
    rendered_slides = rendered.get("slides")
    if not isinstance(rendered_slides, list) or len(rendered_slides) != len(slides):
        raise SchemaV4ExportError("Schema v4 renderer returned an incomplete slide set.")
    title = str(deck.get("deck", {}).get("title") or "Yrkie Presentation")
    if normalized_output_mode == "visual":
        return _export_visual_fidelity_pptx(
            rendered_slides,
            title=title,
            export_watermark=bool(export_watermark),
        )
    stylesheet = rendered.get("stylesheet")
    if not isinstance(stylesheet, str):
        raise SchemaV4ExportError("Schema v4 renderer returned an invalid stylesheet.")
    viewport = rendered.get("viewport", {"width": 1280, "height": 720})
    if not isinstance(viewport, dict) or (viewport.get("width"), viewport.get("height")) not in {(1280, 720), (1080, 1440)}:
        raise SchemaV4ExportError("Schema v4 renderer returned an unsupported canvas size.")
    return _export_editable_pptx(
        rendered_slides,
        stylesheet=stylesheet,
        title=title,
        export_watermark=bool(export_watermark),
        embed_fonts=embed_fonts,
        **({"viewport": (1080, 1440)} if viewport["width"] == 1080 else {}),
    )

export_schema_v4_deck_to_pptx.__module__ = 'schema_v4_export'
