"""Public class assembly for the modular HtmlRenderer implementation."""
from __future__ import annotations
from doe_export.html.renderer.shared import (
    Border,
    BytesIO,
    Fill,
    GEOMETRY_CSS,
    IRPresentation,
    Image,
    Optional,
    Shape,
    TableCell,
    TextFrame,
    VIEWER_CSS,
    VIEWER_JS,
    base64,
    css_font_format,
    html,
    math,
    normalize_hex_color,
    os,
    quote,
    re,
)

class HtmlRenderer:
    """Renders an IR ``Presentation`` to a complete HTML document.

    Args:
        mode: ``"embedded"`` (default) or ``"file"``.
        media_dir: Directory for file‑mode image output.
    """

    from doe_export.html.renderer.document.initialize import __init__

    # ==================================================================
    # Public API
    # ==================================================================

    from doe_export.html.renderer.document.render import render

    from doe_export.html.renderer.document.render_to_file import render_to_file

    # ==================================================================
    # Slide
    # ==================================================================

    from doe_export.html.renderer.document._render_slide import _render_slide

    from doe_export.html.renderer.paint._background_fill_styles import _background_fill_styles

    # ==================================================================
    # Shape dispatch
    # ==================================================================

    from doe_export.html.renderer.structure._render_shape import _render_shape

    # ==================================================================
    # Style helpers
    # ==================================================================

    from doe_export.html.renderer.paint._shape_style import _shape_style

    from doe_export.html.renderer.paint._css_gradient_fill import _css_gradient_fill

    from doe_export.html.renderer.paint._css_url import _css_url

    from doe_export.html.renderer.geometry._geometry_css import _geometry_css

    from doe_export.html.renderer.paint._html_style import _html_style

    from doe_export.html.renderer.text._embedded_font_css import _embedded_font_css

    from doe_export.html.renderer.paint._border_styles import _border_styles

    from doe_export.html.renderer.paint._css_color import _css_color

    from doe_export.html.renderer.paint._css_border_color import _css_border_color

    from doe_export.html.renderer.text._css_font_color import _css_font_color

    from doe_export.html.renderer.text._text_frame_style import _text_frame_style

    from doe_export.html.renderer.text._normalized_text_anchor import _normalized_text_anchor

    # ==================================================================
    # AutoShape
    # ==================================================================

    from doe_export.html.renderer.structure._render_auto_shape import _render_auto_shape

    # ==================================================================
    # Text
    # ==================================================================

    from doe_export.html.renderer.media._render_geometry_svg import _render_geometry_svg

    from doe_export.html.renderer.media._next_svg_token import _next_svg_token

    from doe_export.html.renderer.media._svg_fill_paint import _svg_fill_paint

    from doe_export.html.renderer.media._svg_marker_paint import _svg_marker_paint

    from doe_export.html.renderer.media._svg_stroke_attrs import _svg_stroke_attrs

    from doe_export.html.renderer.media._svg_dasharray import _svg_dasharray

    from doe_export.html.renderer.text._render_text_frame import _render_text_frame

    from doe_export.html.renderer.text._render_text_frame_paragraphs import _render_text_frame_paragraphs

    from doe_export.html.renderer.text._next_auto_bullet_index import _next_auto_bullet_index

    from doe_export.html.renderer.text._render_paragraph import _render_paragraph

    from doe_export.html.renderer.text._render_run import _render_run

    from doe_export.html.renderer.text._css_text_decoration_style import _css_text_decoration_style

    from doe_export.html.renderer.document._safe_href import _safe_href

    from doe_export.html.renderer.text._font_scale import _font_scale

    from doe_export.html.renderer.document._line_spacing_multiple import _line_spacing_multiple

    from doe_export.html.renderer.text._render_bullet import _render_bullet

    from doe_export.html.renderer.text._ordered_bullet_marker import _ordered_bullet_marker

    from doe_export.html.renderer.document._alpha_marker import _alpha_marker

    from doe_export.html.renderer.document._roman_marker import _roman_marker

    from doe_export.html.renderer.text._should_suppress_empty_bullet_paragraph import _should_suppress_empty_bullet_paragraph

    from doe_export.html.renderer.text._first_visible_run_font import _first_visible_run_font

    from doe_export.html.renderer.text._first_font_family import _first_font_family

    from doe_export.html.renderer.text._css_font_stack import _css_font_stack

    from doe_export.html.renderer.text._powerpoint_font_substitution import _powerpoint_font_substitution

    from doe_export.html.renderer.document._contains_cjk import _contains_cjk

    # ==================================================================
    # Picture
    # ==================================================================

    from doe_export.html.renderer.document._render_picture import _render_picture

    from doe_export.html.renderer.media._image_style import _image_style

    from doe_export.html.renderer.media._image_placement import _image_placement

    from doe_export.html.renderer.document._normalized_crop import _normalized_crop

    from doe_export.html.renderer.document._finite_float import _finite_float

    from doe_export.html.renderer.media._image_opacity import _image_opacity

    from doe_export.html.renderer.media._image_effect_filter import _image_effect_filter

    from doe_export.html.renderer.media._image_background_styles import _image_background_styles

    from doe_export.html.renderer.media._missing_image_placeholder_styles import _missing_image_placeholder_styles

    from doe_export.html.renderer.media._image_svg_document import _image_svg_document

    from doe_export.html.renderer.media._image_pattern_definition import _image_pattern_definition

    from doe_export.html.renderer.media._direct_image_background_styles import _direct_image_background_styles

    from doe_export.html.renderer.document._background_position_percent import _background_position_percent

    from doe_export.html.renderer.media._image_intrinsic_size_pt import _image_intrinsic_size_pt

    from doe_export.html.renderer.media._inline_image_bytes import _inline_image_bytes

    from doe_export.html.renderer.media._image_src import _image_src

    from doe_export.html.renderer.media._image_bytes import _image_bytes

    from doe_export.html.renderer.document._ext_from_content_type import _ext_from_content_type

    # ==================================================================
    # Group
    # ==================================================================

    from doe_export.html.renderer.structure._render_group import _render_group

    # ==================================================================
    # Connector
    # ==================================================================

    from doe_export.html.renderer.structure._render_connector import _render_connector

    # ==================================================================
    # GraphicFrame (Table / Chart)
    # ==================================================================

    from doe_export.html.renderer.document._render_graphic_frame import _render_graphic_frame

    from doe_export.html.renderer.text._render_table import _render_table

    from doe_export.html.renderer.text._table_cell_width import _table_cell_width

    from doe_export.html.renderer.text._table_cell_height import _table_cell_height

    from doe_export.html.renderer.text._table_cell_style import _table_cell_style

    from doe_export.html.renderer.paint._css_dash_style import _css_dash_style

    # ==================================================================
    # Chart placeholder
    # ==================================================================

    from doe_export.html.renderer.structure._render_chart import _render_chart

    from doe_export.html.renderer.structure._chart_fallback import _chart_fallback

    from doe_export.html.renderer.structure._nice_chart_step import _nice_chart_step

    from doe_export.html.renderer.structure._chart_ticks import _chart_ticks

    from doe_export.html.renderer.structure._chart_uses_percent import _chart_uses_percent

    from doe_export.html.renderer.structure._format_chart_value import _format_chart_value

    from doe_export.html.renderer.structure._chart_placeholder import _chart_placeholder

