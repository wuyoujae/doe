"""Compatibility API for the modular DOE PowerPoint schema implementation."""
from __future__ import annotations

from doe_export.pptx.schema.shared import (
    base64,
    binascii,
    io,
    json,
    os,
    shutil,
    stat,
    subprocess,
    Path,
    Any,
    Image,
    Presentation,
    Pt,
    apply_pptx_export_watermark,
    export_ir_to_pptx,
    parse_html_to_ir,
    embed_schema_v4_fonts,
    apply_schema_v4_native_components,
    RUNTIME_ROOT,
    RENDERER_CONTRACT,
    COMPILER_CONTRACT,
    WRITER_CONTRACT,
    MAX_RENDERER_STDOUT_BYTES,
    MAX_SLIDES,
    SLIDE_WIDTH_PT,
    SLIDE_HEIGHT_PT,
    SCREENSHOT_WIDTH_PX,
    SCREENSHOT_HEIGHT_PX,
    THUMBNAIL_WIDTH_PX,
    THUMBNAIL_HEIGHT_PX,
    MAX_THUMBNAIL_BYTES,
    MAX_SCREENSHOT_BYTES,
    SchemaV4ExportError,
    __all__,
)
from doe_export.pptx.schema._node_executable import _node_executable
from doe_export.pptx.schema._renderer_root import _renderer_root
from doe_export.pptx.schema._validate_deck import _validate_deck
from doe_export.pptx.schema._render_schema_deck import _render_schema_deck
from doe_export.pptx.schema._merge_presentations import _merge_presentations
from doe_export.pptx.schema._static_slide_html import _static_slide_html
from doe_export.pptx.schema._decode_slide_screenshot import _decode_slide_screenshot
from doe_export.pptx.schema._export_visual_fidelity_pptx import _export_visual_fidelity_pptx
from doe_export.pptx.schema._export_editable_pptx import _export_editable_pptx
from doe_export.pptx.schema.export_schema_v4_deck_to_pptx import export_schema_v4_deck_to_pptx
from doe_export.pptx.schema.render_schema_v4_thumbnail import render_schema_v4_thumbnail
