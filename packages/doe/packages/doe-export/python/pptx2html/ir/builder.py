"""Public class assembly for the modular PresentationBuilder implementation."""
from __future__ import annotations
from doe_export.ir.importer.shared import (
    AnimationStep,
    AutoShape,
    Background,
    BaseShape,
    BaseSlidePart,
    Border,
    Bounds,
    BulletInfo,
    BytesIO,
    ChartInfo,
    ChartSeries,
    Connector,
    ET,
    EmbeddedFont,
    Fill,
    Font,
    GeometryBuilder,
    GradientStop,
    GraphicFrame,
    GroupShape,
    IRPresentation,
    IRSlide,
    Image,
    ImageInfo,
    ImageOps,
    NAMESPACE,
    Optional,
    OrderedDict,
    PackURI,
    Paragraph,
    Path,
    Picture,
    PlaceholderInfo,
    PomPresentation,
    PomTextFrame,
    RELATIONSHIP_TYPE,
    Run,
    Shadow,
    Shape,
    ShapeTree,
    SlidePart,
    SlideTransition,
    TARGET_MODE,
    TabStop,
    TableCell,
    TableInfo,
    TextFrame,
    ThreeDInfo,
    _BoundedMetafileCache,
    _DEFAULT_COLOR_MAP,
    _DEFAULT_TEXT_MARGINS_PT,
    _EMF2SVG_ALLOWED_ATTRIBUTES,
    _EMF2SVG_ALLOWED_DATA_IMAGE_PREFIXES,
    _EMF2SVG_ALLOWED_ELEMENTS,
    _EMF2SVG_DEFAULT_EXECUTABLE,
    _EMF2SVG_EXECUTABLE_ENV,
    _EMF2SVG_MAX_COORDINATE,
    _EMF2SVG_MAX_DIMENSION,
    _EMF2SVG_MAX_ELEMENTS,
    _EMF2SVG_MAX_OUTPUT_BYTES,
    _EMF2SVG_MAX_ROOT_DIMENSION_PT,
    _EMF2SVG_NUMBER_PATTERN,
    _EMF2SVG_NUMERIC_ATTRIBUTES,
    _EMF2SVG_SVG_NAMESPACE,
    _EMF2SVG_TIMEOUT_SECONDS,
    _EMF2SVG_XLINK_NAMESPACE,
    _EMF2SVG_XML_NAMESPACE,
    _EMF_CONTENT_TYPES,
    _METAFILE_CACHE,
    _METAFILE_CACHE_MAX_BYTES,
    _METAFILE_CACHE_MAX_ENTRIES,
    _METAFILE_CONTENT_TYPES,
    _METAFILE_EXTENSIONS,
    _PREVIEW_IMAGE_MAX_PIXELS,
    _SVG_CONTENT_TYPES,
    base64,
    colorsys,
    copy,
    emu_to_pt,
    font_content_type_from_magic,
    hashlib,
    local_name,
    math,
    normalize_hex_color,
    os,
    parse_bool,
    percentage_to_float,
    re,
    struct,
    subprocess,
    tempfile,
    threading,
)

class PresentationBuilder:
    """Build an IR ``Presentation`` from a POM ``Presentation``."""

    from doe_export.ir.importer.document.initialize import __init__

    from doe_export.ir.importer.document.build import build

    # ------------------------------------------------------------------
    # Relationships
    # ------------------------------------------------------------------

    from doe_export.ir.importer.document._relationship_owner_part import _relationship_owner_part

    from doe_export.ir.importer.document._relationship_by_id import _relationship_by_id

    from doe_export.ir.importer.document._related_part_by_id import _related_part_by_id

    from doe_export.ir.importer.document._owner_part_chain import _owner_part_chain

    from doe_export.ir.importer.document._owner_cache_key import _owner_cache_key

    from doe_export.ir.importer.document._relationship_target_by_id import _relationship_target_by_id

    # ------------------------------------------------------------------
    # Slide
    # ------------------------------------------------------------------

    from doe_export.ir.importer.document._build_slide import _build_slide

    from doe_export.ir.importer.structure._mark_shape_source_scope import _mark_shape_source_scope

    from doe_export.ir.importer.structure._inherited_shape_source_scope import _inherited_shape_source_scope

    from doe_export.ir.importer.document._build_slide_transition import _build_slide_transition

    from doe_export.ir.importer.document._build_slide_animations import _build_slide_animations

    from doe_export.ir.importer.document._transition_duration_ms import _transition_duration_ms

    from doe_export.ir.importer.document._duration_ms import _duration_ms

    from doe_export.ir.importer.document._animation_attr_names import _animation_attr_names

    from doe_export.ir.importer.document._first_start_condition import _first_start_condition

    from doe_export.ir.importer.document._ctn_start_delay_ms import _ctn_start_delay_ms

    from doe_export.ir.importer.document._ctn_is_click_trigger import _ctn_is_click_trigger

    from doe_export.ir.importer.structure._animation_group_meta import _animation_group_meta

    from doe_export.ir.importer.document._animation_to_value import _animation_to_value

    from doe_export.ir.importer.document._animation_value_at import _animation_value_at

    from doe_export.ir.importer.document._animation_raw_attrs import _animation_raw_attrs

    from doe_export.ir.importer.document._populate_animation_motion import _populate_animation_motion

    from doe_export.ir.importer.geometry._populate_animation_scale import _populate_animation_scale

    from doe_export.ir.importer.structure._inherited_render_shapes import _inherited_render_shapes

    from doe_export.ir.importer.structure._show_master_shapes import _show_master_shapes

    from doe_export.ir.importer.structure._non_placeholder_shapes import _non_placeholder_shapes

    from doe_export.ir.importer.document._build_background import _build_background

    from doe_export.ir.importer.document._background_inheritance_chain import _background_inheritance_chain

    from doe_export.ir.importer.paint._find_background_fill_container import _find_background_fill_container

    from doe_export.ir.importer.paint._background_fill_from_ref import _background_fill_from_ref

    # ------------------------------------------------------------------
    # Shape dispatch
    # ------------------------------------------------------------------

    from doe_export.ir.importer.structure._build_shape import _build_shape

    from doe_export.ir.importer.structure._build_shape_for_owner import _build_shape_for_owner

    from doe_export.ir.importer.structure._shape_sp_pr import _shape_sp_pr

    from doe_export.ir.importer.media._image_alpha import _image_alpha

    from doe_export.ir.importer.structure._shape_render_diagnostics import _shape_render_diagnostics

    from doe_export.ir.importer.document._effect_render_diagnostics import _effect_render_diagnostics

    from doe_export.ir.importer.structure._build_auto_shape import _build_auto_shape

    from doe_export.ir.importer.document._build_picture import _build_picture

    from doe_export.ir.importer.structure._build_connector import _build_connector

    from doe_export.ir.importer.structure._build_group import _build_group

    from doe_export.ir.importer.document._build_graphic_frame import _build_graphic_frame

    from doe_export.ir.importer.structure._build_smartart_cached_group import _build_smartart_cached_group

    from doe_export.ir.importer.geometry._smartart_geometry_is_bounded import _smartart_geometry_is_bounded

    from doe_export.ir.importer.text._build_smartart_text_frame import _build_smartart_text_frame

    # ------------------------------------------------------------------
    # Bounds
    # ------------------------------------------------------------------

    from doe_export.ir.importer.geometry._build_bounds import _build_bounds

    from doe_export.ir.importer.geometry._build_direct_bounds import _build_direct_bounds

    from doe_export.ir.importer.document._build_flip import _build_flip

    from doe_export.ir.importer.geometry._build_group_bounds import _build_group_bounds

    from doe_export.ir.importer.structure._normalize_group_children import _normalize_group_children

    from doe_export.ir.importer.structure._placeholder_sources import _placeholder_sources

    from doe_export.ir.importer.structure._placeholder_part_chain import _placeholder_part_chain

    from doe_export.ir.importer.structure._find_matching_placeholder import _find_matching_placeholder

    # ------------------------------------------------------------------
    # Placeholder
    # ------------------------------------------------------------------

    from doe_export.ir.importer.structure._build_placeholder import _build_placeholder

    # ------------------------------------------------------------------
    # Inherited visual style
    # ------------------------------------------------------------------

    from doe_export.ir.importer.geometry._build_geometry_info import _build_geometry_info

    from doe_export.ir.importer.geometry._geometry_name_from_sp_pr import _geometry_name_from_sp_pr

    from doe_export.ir.importer.geometry._build_geometry import _build_geometry

    from doe_export.ir.importer.paint._build_fill import _build_fill

    from doe_export.ir.importer.paint._build_border import _build_border

    from doe_export.ir.importer.paint._line_has_no_fill import _line_has_no_fill

    from doe_export.ir.importer.paint._merge_border_style import _merge_border_style

    from doe_export.ir.importer.paint._apply_default_border_width import _apply_default_border_width

    # ------------------------------------------------------------------
    # Fill
    # ------------------------------------------------------------------

    from doe_export.ir.importer.paint._parse_fill import _parse_fill

    from doe_export.ir.importer.paint._build_fill_choice import _build_fill_choice

    from doe_export.ir.importer.paint._build_solid_fill import _build_solid_fill

    from doe_export.ir.importer.paint._build_gradient_fill import _build_gradient_fill

    from doe_export.ir.importer.paint._build_pattern_fill import _build_pattern_fill

    from doe_export.ir.importer.paint._build_picture_fill import _build_picture_fill

    from doe_export.ir.importer.media._build_blip_image_info import _build_blip_image_info

    from doe_export.ir.importer.media._compressed_preview_image_blob import _compressed_preview_image_blob

    from doe_export.ir.importer.document._build_blip_effects import _build_blip_effects

    from doe_export.ir.importer.media._image_intrinsic_size_pt import _image_intrinsic_size_pt

    from doe_export.ir.importer.media._svg_intrinsic_size_pt import _svg_intrinsic_size_pt

    from doe_export.ir.importer.media._svg_length_pt import _svg_length_pt

    from doe_export.ir.importer.document._positive_finite_float import _positive_finite_float

    from doe_export.ir.importer.document._blip_embed_id import _blip_embed_id

    from doe_export.ir.importer.media._browser_ready_image_blob import _browser_ready_image_blob

    from doe_export.ir.importer.media._is_svg_image import _is_svg_image

    from doe_export.ir.importer.media._normalize_svg_intrinsic_size import _normalize_svg_intrinsic_size

    from doe_export.ir.importer.media._is_metafile_image import _is_metafile_image

    from doe_export.ir.importer.media._is_emf_image import _is_emf_image

    from doe_export.ir.importer.text._is_windows_runtime import _is_windows_runtime

    from doe_export.ir.importer.media._rasterize_metafile import _rasterize_metafile

    from doe_export.ir.importer.media._emf2svg_executable import _emf2svg_executable

    from doe_export.ir.importer.media._convert_emf_to_svg import _convert_emf_to_svg

    from doe_export.ir.importer.media._is_safe_browser_svg import _is_safe_browser_svg

    from doe_export.ir.importer.document._expanded_xml_name import _expanded_xml_name

    from doe_export.ir.importer.media._has_bounded_svg_numbers import _has_bounded_svg_numbers

    from doe_export.ir.importer.media._is_bounded_svg_view_box import _is_bounded_svg_view_box

    from doe_export.ir.importer.media._rasterize_metafile_with_pillow import _rasterize_metafile_with_pillow

    from doe_export.ir.importer.document._drawingml_rect_percentages import _drawingml_rect_percentages

    from doe_export.ir.importer.paint._fill_from_style_ref import _fill_from_style_ref

    from doe_export.ir.importer.paint._fill_from_theme_matrix import _fill_from_theme_matrix

    from doe_export.ir.importer.paint._border_from_style_ref import _border_from_style_ref

    from doe_export.ir.importer.paint._shadow_from_style_ref import _shadow_from_style_ref

    from doe_export.ir.importer.paint._theme_fill_style_by_idx import _theme_fill_style_by_idx

    from doe_export.ir.importer.paint._theme_style_by_idx import _theme_style_by_idx

    from doe_export.ir.importer.paint._style_ref import _style_ref

    from doe_export.ir.importer.paint._color_from_fill_elem import _color_from_fill_elem

    from doe_export.ir.importer.geometry._apply_color_transforms import _apply_color_transforms

    from doe_export.ir.importer.geometry._alpha_from_color_transforms import _alpha_from_color_transforms

    # ------------------------------------------------------------------
    # Border
    # ------------------------------------------------------------------

    from doe_export.ir.importer.paint._parse_border import _parse_border

    from doe_export.ir.importer.paint._border_from_line import _border_from_line

    from doe_export.ir.importer.paint._build_shadow import _build_shadow

    from doe_export.ir.importer.document._build_effects import _build_effects

    from doe_export.ir.importer.paint._parse_shadow import _parse_shadow

    from doe_export.ir.importer.paint._primary_shadow import _primary_shadow

    from doe_export.ir.importer.document._parse_effects import _parse_effects

    from doe_export.ir.importer.document._build_three_d import _build_three_d

    from doe_export.ir.importer.paint._three_d_from_style_ref import _three_d_from_style_ref

    from doe_export.ir.importer.document._parse_three_d import _parse_three_d

    # ------------------------------------------------------------------
    # Text
    # ------------------------------------------------------------------

    from doe_export.ir.importer.text._build_text_frame import _build_text_frame

    from doe_export.ir.importer.text._build_text_frame_from_element import _build_text_frame_from_element

    from doe_export.ir.importer.text._effective_text_body_props import _effective_text_body_props

    from doe_export.ir.importer.text._merge_text_body_props_from_body_pr import _merge_text_body_props_from_body_pr

    from doe_export.ir.importer.text._text_style_provenance import _text_style_provenance

    from doe_export.ir.importer.text._effective_text_margins import _effective_text_margins

    from doe_export.ir.importer.text._paragraph_level import _paragraph_level

    from doe_export.ir.importer.document._word_wrap_from_body_pr import _word_wrap_from_body_pr

    from doe_export.ir.importer.text._text_margins_from_body_pr import _text_margins_from_body_pr

    from doe_export.ir.importer.text._text_body_props import _text_body_props

    from doe_export.ir.importer.text._runs_from_paragraph import _runs_from_paragraph

    from doe_export.ir.importer.text._text_from_text_run import _text_from_text_run

    from doe_export.ir.importer.document._angle_to_degrees import _angle_to_degrees

    from doe_export.ir.importer.text._tab_stops_from_ppr import _tab_stops_from_ppr

    from doe_export.ir.importer.text._bullet_from_ppr import _bullet_from_ppr

    from doe_export.ir.importer.text._default_paragraph_props import _default_paragraph_props

    from doe_export.ir.importer.text._paragraph_props_from_text_defaults import _paragraph_props_from_text_defaults

    from doe_export.ir.importer.text._master_text_style_paragraph_props import _master_text_style_paragraph_props

    from doe_export.ir.importer.text._paragraph_props_from_text_style import _paragraph_props_from_text_style

    from doe_export.ir.importer.text._paragraph_props_from_ppr import _paragraph_props_from_ppr

    from doe_export.ir.importer.text._default_font_props import _default_font_props

    from doe_export.ir.importer.text._font_props_from_shape_style_ref import _font_props_from_shape_style_ref

    from doe_export.ir.importer.text._end_para_font import _end_para_font

    from doe_export.ir.importer.text._font_props_from_text_defaults import _font_props_from_text_defaults

    from doe_export.ir.importer.text._master_text_style_props import _master_text_style_props

    from doe_export.ir.importer.text._master_text_style_name import _master_text_style_name

    from doe_export.ir.importer.text._font_props_from_level_style import _font_props_from_level_style

    from doe_export.ir.importer.text._paragraph_for_level import _paragraph_for_level

    from doe_export.ir.importer.text._font_props_from_rpr import _font_props_from_rpr

    from doe_export.ir.importer.text._font_families_from_rpr import _font_families_from_rpr

    from doe_export.ir.importer.paint._color_from_solid_fill import _color_from_solid_fill

    from doe_export.ir.importer.text._font_from_props import _font_from_props

    from doe_export.ir.importer.text._effective_font_family import _effective_font_family

    from doe_export.ir.importer.document._contains_cjk import _contains_cjk

    from doe_export.ir.importer.geometry._centipoints_to_pt import _centipoints_to_pt

    from doe_export.ir.importer.document._get_spacing_info import _get_spacing_info

    from doe_export.ir.importer.document._spacing_info_from_ppr import _spacing_info_from_ppr

    from doe_export.ir.importer.document._get_line_spacing_info import _get_line_spacing_info

    from doe_export.ir.importer.document._line_spacing_info_from_ppr import _line_spacing_info_from_ppr

    from doe_export.ir.importer.document._line_spacing_info_from_element import _line_spacing_info_from_element

    from doe_export.ir.importer.document._get_spacing import _get_spacing

    from doe_export.ir.importer.document._get_line_spacing_multiple import _get_line_spacing_multiple

    from doe_export.ir.importer.document._get_line_spacing_pt import _get_line_spacing_pt

    from doe_export.ir.importer.document._find_line_spacing import _find_line_spacing

    # ------------------------------------------------------------------
    # Table
    # ------------------------------------------------------------------

    from doe_export.ir.importer.text._build_table import _build_table

    from doe_export.ir.importer.text._table_cell_margins import _table_cell_margins

    from doe_export.ir.importer.text._table_cell_borders import _table_cell_borders

    from doe_export.ir.importer.text._table_cell_text_style_props import _table_cell_text_style_props

    from doe_export.ir.importer.text._table_cell_visual_style import _table_cell_visual_style

    from doe_export.ir.importer.document._positive_int import _positive_int

    from doe_export.ir.importer.document._optional_int import _optional_int

    from doe_export.ir.importer.document._optional_float import _optional_float

    # ------------------------------------------------------------------
    # Chart
    # ------------------------------------------------------------------

    from doe_export.ir.importer.structure._build_chart import _build_chart

    from doe_export.ir.importer.structure._first_chart_element import _first_chart_element

    from doe_export.ir.importer.structure._chart_title import _chart_title

    from doe_export.ir.importer.structure._chart_values import _chart_values

    from doe_export.ir.importer.structure._chart_child_attr import _chart_child_attr

    from doe_export.ir.importer.structure._chart_num_format import _chart_num_format

    from doe_export.ir.importer.structure._chart_data_label_format import _chart_data_label_format

    from doe_export.ir.importer.structure._chart_show_value_labels import _chart_show_value_labels

    from doe_export.ir.importer.paint._chart_series_color import _chart_series_color

    # ------------------------------------------------------------------
    # Embedded fonts
    # ------------------------------------------------------------------

    from doe_export.ir.importer.text._load_embedded_fonts import _load_embedded_fonts

    from doe_export.ir.importer.text._load_table_text_styles import _load_table_text_styles

    from doe_export.ir.importer.text._load_table_cell_style_elements import _load_table_cell_style_elements

    from doe_export.ir.importer.text._parse_table_cell_style_elements import _parse_table_cell_style_elements

    from doe_export.ir.importer.text._parse_table_text_styles import _parse_table_text_styles

    from doe_export.ir.importer.text._font_props_from_table_tx_style import _font_props_from_table_tx_style

    from doe_export.ir.importer.text._browser_ready_font_blob import _browser_ready_font_blob

    # ------------------------------------------------------------------
    # Theme colors
    # ------------------------------------------------------------------

    from doe_export.ir.importer.paint._load_theme_colors import _load_theme_colors

    from doe_export.ir.importer.paint._parse_theme_colors import _parse_theme_colors

    from doe_export.ir.importer.document._related_parts_for_type import _related_parts_for_type

    from doe_export.ir.importer.paint._theme_colors_for_owner import _theme_colors_for_owner

    from doe_export.ir.importer.paint._effective_color_map import _effective_color_map

    from doe_export.ir.importer.paint._resolve_color import _resolve_color

    # ------------------------------------------------------------------
    # Theme format styles
    # ------------------------------------------------------------------

    from doe_export.ir.importer.paint._load_theme_format_styles import _load_theme_format_styles

    from doe_export.ir.importer.paint._load_theme_three_d_styles import _load_theme_three_d_styles

    from doe_export.ir.importer.paint._parse_theme_format_styles import _parse_theme_format_styles

    from doe_export.ir.importer.paint._parse_theme_three_d_styles import _parse_theme_three_d_styles

    # ------------------------------------------------------------------
    # Theme fonts
    # ------------------------------------------------------------------

    from doe_export.ir.importer.text._load_theme_fonts import _load_theme_fonts

    from doe_export.ir.importer.text._parse_theme_fonts import _parse_theme_fonts

    from doe_export.ir.importer.text._resolve_theme_font import _resolve_theme_font

