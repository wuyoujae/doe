"""Public compatibility API for the modular DOE pipeline engine."""
from __future__ import annotations
from doe_export.pipeline.shared import (
    Any,
    BytesIO,
    COPYIST_PARSER_VERSION,
    CanonicalHtmlRenderer,
    ET,
    FORBIDDEN_SLIDE_TAGS,
    HTMLParser,
    HtmlCompileError,
    InvalidTextLayoutSnapshot,
    Path,
    PomPresentation,
    PresentationBuilder,
    RUNTIME_ROOT,
    SLIDE_ROOT_TAGS,
    VOID_SLIDE_TAGS,
    WATERMARK_BOTTOM_PT,
    WATERMARK_HEIGHT_PT,
    WATERMARK_RIGHT_PT,
    WATERMARK_WIDTH_PT,
    _ACTIVE_SVG_TAGS,
    _ANY_DATA_URL_PATTERN,
    _ASSET_REFERENCE_PATTERN,
    _CANONICAL_EDITABLE_FRAGMENT_PATTERN,
    _CANONICAL_PAYLOAD_CONTENT_PATTERN,
    _CANONICAL_PAYLOAD_PATTERN,
    _CANONICAL_SLIDE_FRAGMENT_PATTERN,
    _DATA_URL_PATTERN,
    _DOCUMENT_PADDING_PATTERN,
    _EXTERNAL_CSS_RESOURCE_PATTERN,
    _EXTERNAL_RESOURCE_SCHEME_PATTERN,
    _LOGGER,
    _PERCENT_SVG_DATA_URL_PATTERN,
    _RESOURCE_ELEMENT_PATTERN,
    _SAFE_RASTER_DATA_URL_PATTERN,
    _SLIDE_COORDINATE_HEIGHT_KEY,
    _SLIDE_COORDINATE_WIDTH_KEY,
    _SOURCE_SLIDE_INDEX_KEY,
    _STATIC_EXPORT_STYLE,
    _STYLE_ATTRIBUTE_PATTERN,
    _STYLE_BLOCK_PATTERN,
    _SVG_CSS_URL_PATTERN,
    _SVG_EXTERNAL_RESOURCE_PATTERN,
    _TRANSPARENT_PIXEL_DATA_URL,
    apply_pptx_export_watermark,
    base64,
    binascii,
    capture_html_screenshots,
    compile_html,
    compile_slide_fragment,
    compile_slide_fragments,
    copy,
    dataclasses,
    embed_traditional_slide_fonts,
    export_watermark_data_uri,
    font_content_type_from_magic,
    hashlib,
    ir_contains_inline_asset,
    json,
    layout_snapshot_is_valid,
    logging,
    make_text_container_metrics,
    math,
    normalize_transient_asset_payloads,
    os,
    presentation_from_dict,
    print_html_to_pdf,
    re,
    recover_serialized_html_source,
    refresh_no_wrap_layout_snapshot,
    remove_embedded_fonts,
    remove_pptx_export_watermark,
    sys,
    tempfile,
    unquote_to_bytes,
    validate_pptx_archive,
    write_pptx_from_ir,
    zipfile,
)
from doe_export.pipeline.pptx.import_pptx_to_canonical import import_pptx_to_canonical
from doe_export.pipeline.canonical.render_ir_to_canonical import render_ir_to_canonical
from doe_export.pipeline.html.export_ir_to_html import export_ir_to_html
from doe_export.pipeline.assets._validate_self_contained_presentation_resources import _validate_self_contained_presentation_resources
from doe_export.pipeline.assets._validate_embedded_svg_resource import _validate_embedded_svg_resource
from doe_export.pipeline.assets._validate_rendered_html_resources import _validate_rendered_html_resources
from doe_export.pipeline.html.extract_editable_slide_html import extract_editable_slide_html
from doe_export.pipeline.presentation.render_ir_to_slide_document import render_ir_to_slide_document
from doe_export.pipeline.assets._apply_browser_asset_overrides_to_ir import _apply_browser_asset_overrides_to_ir
from doe_export.pipeline.presentation._embedded_fonts_use_managed_references import _embedded_fonts_use_managed_references
from doe_export.pipeline.canonical._restore_unknown_ir_metadata import _restore_unknown_ir_metadata
from doe_export.pipeline.canonical._current_ir_storage_bytes import _current_ir_storage_bytes
from doe_export.pipeline.canonical._current_ir_storage_sha256 import _current_ir_storage_sha256
from doe_export.pipeline.validation._validated_canonical_slide_ir import _validated_canonical_slide_ir
from doe_export.pipeline.text_layout._normalize_editor_text_layout import _normalize_editor_text_layout
from doe_export.pipeline.text_layout._presentation_ir_with_export_text_layout import _presentation_ir_with_export_text_layout
from doe_export.pipeline.text_layout._canonical_text_layout_targets import _canonical_text_layout_targets
from doe_export.pipeline.text_layout._shape_text_container_metrics import _shape_text_container_metrics
from doe_export.pipeline.text_layout._text_container_metrics import _text_container_metrics
from doe_export.pipeline.text_layout._text_layout_requires_normalization import _text_layout_requires_normalization
from doe_export.pipeline.text_layout._presentation_ir_with_legacy_layout_dirty import _presentation_ir_with_legacy_layout_dirty
from doe_export.pipeline.canonical._canonical_payload_presentation_dict import _canonical_payload_presentation_dict
from doe_export.pipeline.pdf.export_ir_to_pdf import export_ir_to_pdf
from doe_export.pipeline.png.render_ir_preview_png import render_ir_preview_png
from doe_export.pipeline.png.export_ir_to_png_zip import export_ir_to_png_zip
from doe_export.pipeline.presentation._presentation_for_static_export import _presentation_for_static_export
from doe_export.pipeline.presentation._presentation_ir_without_export_watermarks import _presentation_ir_without_export_watermarks
from doe_export.pipeline.presentation._shape_list_has_export_watermark import _shape_list_has_export_watermark
from doe_export.pipeline.presentation._shape_list_without_export_watermarks import _shape_list_without_export_watermarks
from doe_export.pipeline.html._static_export_html import _static_export_html
from doe_export.pipeline.presentation._static_export_watermark_style import _static_export_watermark_style
from doe_export.pipeline.assets._normalized_asset_content_type import _normalized_asset_content_type
from doe_export.pipeline.assets._externalize_ir_assets import _externalize_ir_assets
from doe_export.pipeline.assets._assert_no_inline_binary_html import _assert_no_inline_binary_html
from doe_export.pipeline.assets._assert_no_inline_binary_ir import _assert_no_inline_binary_ir
from doe_export.pipeline.assets._InlineAssetHtmlGuard import _InlineAssetHtmlGuard
from doe_export.pipeline.assets._svg_local_name import _svg_local_name
from doe_export.pipeline.assets._svg_css_is_unsafe import _svg_css_is_unsafe
from doe_export.pipeline.assets._sanitize_composed_svg_asset import _sanitize_composed_svg_asset
from doe_export.pipeline.assets._transparent_svg_placeholder import _transparent_svg_placeholder
from doe_export.pipeline.assets._externalize_canonical_assets import _externalize_canonical_assets
from doe_export.pipeline.canonical._refresh_canonical_slide_hashes import _refresh_canonical_slide_hashes
from doe_export.pipeline.pptx._validate_pptx_package import _validate_pptx_package
from doe_export.pipeline.html.parse_html_to_ir import parse_html_to_ir
from doe_export.pipeline.html.parse_html_to_presentation_ir import parse_html_to_presentation_ir
from doe_export.pipeline.text_layout._SlideDocumentExtractor import _SlideDocumentExtractor
from doe_export.pipeline.validation._SlideFragmentValidator import _SlideFragmentValidator
from doe_export.pipeline.html.normalize_slide_fragment import normalize_slide_fragment
from doe_export.pipeline.html.parse_slide_fragment_to_ir import parse_slide_fragment_to_ir
from doe_export.pipeline.html.parse_slide_fragments_to_ir import parse_slide_fragments_to_ir
from doe_export.pipeline.geometry._presentation_ir_in_export_coordinate_space import _presentation_ir_in_export_coordinate_space
from doe_export.pipeline.geometry._positive_number import _positive_number
from doe_export.pipeline.geometry._scale_optional_number import _scale_optional_number
from doe_export.pipeline.geometry._scale_bounds_for_export import _scale_bounds_for_export
from doe_export.pipeline.geometry._scale_shadow_for_export import _scale_shadow_for_export
from doe_export.pipeline.geometry._scale_border_for_export import _scale_border_for_export
from doe_export.pipeline.geometry._scale_font_for_export import _scale_font_for_export
from doe_export.pipeline.text_layout._scale_text_frame_for_export import _scale_text_frame_for_export
from doe_export.pipeline.assets._scale_image_for_export import _scale_image_for_export
from doe_export.pipeline.assets._scale_fill_image_for_export import _scale_fill_image_for_export
from doe_export.pipeline.geometry._scale_table_for_export import _scale_table_for_export
from doe_export.pipeline.geometry._scale_shape_for_export import _scale_shape_for_export
from doe_export.pipeline.pptx.export_ir_to_pptx import export_ir_to_pptx
from doe_export.pipeline.pptx.html_to_pptx import html_to_pptx
from doe_export.pipeline.pptx._source_pptx_bytes import _source_pptx_bytes
