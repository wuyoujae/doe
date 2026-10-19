"""Public compatibility API for the modular DOE pptx/writer engine."""
from __future__ import annotations
from doe_export.pptx.writer.shared import (
    Any,
    ET,
    InvalidTextLayoutSnapshot,
    MAX_IMAGE_PAYLOAD_BYTES,
    MAX_IMAGE_PIXELS,
    MAX_SVG_RASTER_AXIS,
    MSO_ANCHOR,
    MSO_AUTO_SHAPE_TYPE,
    MSO_CONNECTOR,
    OxmlElement,
    PILImage,
    PP_ALIGN,
    Path,
    PptxPresentation,
    Pt,
    RGBColor,
    RoundtripFallbackRequired,
    SVG_LENGTH_RE,
    SVG_NAMESPACE,
    SVG_PATH_TOKEN_RE,
    UnidentifiedImageError,
    export_ready_image_payload,
    has_image_payload,
    io,
    make_text_container_metrics,
    materialize_layout_snapshot,
    math,
    normalize_htmlir_export_line_edges,
    parse_xml,
    qn,
    re,
    tempfile,
    write_roundtrip_pptx_from_ir,
)
from doe_export.pptx.writer.package.write_pptx_from_ir import write_pptx_from_ir
from doe_export.pptx.writer.shape._add_shape import _add_shape
from doe_export.pptx.writer.shape._add_auto_shape import _add_auto_shape
from doe_export.pptx.writer.xml._add_connector import _add_connector
from doe_export.pptx.writer.xml._add_picture import _add_picture
from doe_export.pptx.writer.table._add_table import _add_table
from doe_export.pptx.writer.xml._add_icon import _add_icon
from doe_export.pptx.writer.xml._apply_slide_transition import _apply_slide_transition
from doe_export.pptx.writer.xml._apply_slide_timing import _apply_slide_timing
from doe_export.pptx.writer.xml._build_animation_wrapper import _build_animation_wrapper
from doe_export.pptx.writer.xml._build_animation_behavior import _build_animation_behavior
from doe_export.pptx.writer.xml._animation_common_behavior import _animation_common_behavior
from doe_export.pptx.writer.xml._normalize_animation_step import _normalize_animation_step
from doe_export.pptx.writer.xml._animation_preset_attrs import _animation_preset_attrs
from doe_export.pptx.writer.xml._append_start_condition import _append_start_condition
from doe_export.pptx.writer.xml._ctn import _ctn
from doe_export.pptx.writer.xml._slide_target import _slide_target
from doe_export.pptx.writer.geometry._motion_path_from_step import _motion_path_from_step
from doe_export.pptx.writer.xml._format_motion_value import _format_motion_value
from doe_export.pptx.writer.geometry._animation_scale_to_ooxml import _animation_scale_to_ooxml
from doe_export.pptx.writer.xml._safe_transition_type import _safe_transition_type
from doe_export.pptx.writer.xml._transition_direction_attr import _transition_direction_attr
from doe_export.pptx.writer.xml._transition_speed_from_duration import _transition_speed_from_duration
from doe_export.pptx.writer.xml._insert_slide_child_before import _insert_slide_child_before
from doe_export.pptx.writer.shape._register_exported_shape import _register_exported_shape
from doe_export.pptx.writer.xml._apply_slide_background import _apply_slide_background
from doe_export.pptx.writer.xml._apply_picture_slide_background import _apply_picture_slide_background
from doe_export.pptx.writer.shape._apply_fill import _apply_fill
from doe_export.pptx.writer.shape._apply_picture_fill import _apply_picture_fill
from doe_export.pptx.writer.assets._add_image_part import _add_image_part
from doe_export.pptx.writer.package._source_free_export_ready_image_payload import _source_free_export_ready_image_payload
from doe_export.pptx.writer.geometry._rasterize_static_svg import _rasterize_static_svg
from doe_export.pptx.writer.geometry._svg_raster_dimensions import _svg_raster_dimensions
from doe_export.pptx.writer.geometry._svg_view_box import _svg_view_box
from doe_export.pptx.writer.geometry._svg_length_px import _svg_length_px
from doe_export.pptx.writer.shape._build_blip_fill import _build_blip_fill
from doe_export.pptx.writer.shape._append_blip_fill_layout import _append_blip_fill_layout
from doe_export.pptx.writer.shape._apply_line import _apply_line
from doe_export.pptx.writer.shape._apply_line_xml import _apply_line_xml
from doe_export.pptx.writer.geometry._apply_custom_geometry import _apply_custom_geometry
from doe_export.pptx.writer.geometry._append_svg_line_path import _append_svg_line_path
from doe_export.pptx.writer.xml._ooxml_coord import _ooxml_coord
from doe_export.pptx.writer.xml._apply_picture_crop_and_alpha import _apply_picture_crop_and_alpha
from doe_export.pptx.writer.table._apply_cell_fill import _apply_cell_fill
from doe_export.pptx.writer.table._clear_table_defaults import _clear_table_defaults
from doe_export.pptx.writer.table._apply_table_cell_properties import _apply_table_cell_properties
from doe_export.pptx.writer.text._apply_text_frame import _apply_text_frame
from doe_export.pptx.writer.text._apply_text_body_properties import _apply_text_body_properties
from doe_export.pptx.writer.text._text_container_metrics import _text_container_metrics
from doe_export.pptx.writer.text._shape_text_container_metrics import _shape_text_container_metrics
from doe_export.pptx.writer.text._apply_paragraph_properties import _apply_paragraph_properties
from doe_export.pptx.writer.text._apply_paragraph_bullet import _apply_paragraph_bullet
from doe_export.pptx.writer.text._apply_run_font import _apply_run_font
from doe_export.pptx.writer.text._apply_run_underline_details import _apply_run_underline_details
from doe_export.pptx.writer.shape._underline_to_dash import _underline_to_dash
from doe_export.pptx.writer.text._apply_run_font_families import _apply_run_font_families
from doe_export.pptx.writer.text._apply_run_font_spacing import _apply_run_font_spacing
from doe_export.pptx.writer.xml._pt_to_emu import _pt_to_emu
from doe_export.pptx.writer.xml._bool_to_xml import _bool_to_xml
from doe_export.pptx.writer.text._preserve_run_text_space import _preserve_run_text_space
from doe_export.pptx.writer.text._text_needs_xml_space import _text_needs_xml_space
from doe_export.pptx.writer.shape._shape_type import _shape_type
from doe_export.pptx.writer.text._is_text_box import _is_text_box
from doe_export.pptx.writer.xml._looks_like_icon import _looks_like_icon
from doe_export.pptx.writer.text._formula_text_frame import _formula_text_frame
from doe_export.pptx.writer.text._plain_text_frame import _plain_text_frame
from doe_export.pptx.writer.text._paragraph_alignment import _paragraph_alignment
from doe_export.pptx.writer.xml._vertical_anchor import _vertical_anchor
from doe_export.pptx.writer.table._table_vertical_anchor import _table_vertical_anchor
from doe_export.pptx.writer.text._text_anchor import _text_anchor
from doe_export.pptx.writer.xml._hex_color import _hex_color
from doe_export.pptx.writer.xml._clean_hex import _clean_hex
from doe_export.pptx.writer.xml._apply_solid_alpha import _apply_solid_alpha
from doe_export.pptx.writer.text._apply_run_font_alpha import _apply_run_font_alpha
from doe_export.pptx.writer.xml._append_blip_alpha import _append_blip_alpha
from doe_export.pptx.writer.xml._apply_picture_effects import _apply_picture_effects
from doe_export.pptx.writer.xml._append_blip_effects import _append_blip_effects
from doe_export.pptx.writer.xml._append_src_rect import _append_src_rect
from doe_export.pptx.writer.shape._apply_gradient_fill import _apply_gradient_fill
from doe_export.pptx.writer.shape._apply_shadow import _apply_shadow
from doe_export.pptx.writer.shape._write_shadow_xml import _write_shadow_xml
from doe_export.pptx.writer.shape._shadow_direction_to_ooxml import _shadow_direction_to_ooxml
from doe_export.pptx.writer.shape._shape_sp_pr import _shape_sp_pr
from doe_export.pptx.writer.package._remove_presentation_shape_style import _remove_presentation_shape_style
from doe_export.pptx.writer.shape._clear_fill_children import _clear_fill_children
from doe_export.pptx.writer.shape._insert_before_line_or_append import _insert_before_line_or_append
from doe_export.pptx.writer.table._insert_table_cell_fill_or_append import _insert_table_cell_fill_or_append
from doe_export.pptx.writer.table._table_cell_border_xml import _table_cell_border_xml
from doe_export.pptx.writer.shape._insert_before_fill_or_append import _insert_before_fill_or_append
from doe_export.pptx.writer.xml._insert_effect_or_append import _insert_effect_or_append
from doe_export.pptx.writer.xml._remove_children import _remove_children
from doe_export.pptx.writer.xml._first_xml_descendant import _first_xml_descendant
from doe_export.pptx.writer.xml._append_srgb import _append_srgb
from doe_export.pptx.writer.xml._alpha_to_ooxml import _alpha_to_ooxml
from doe_export.pptx.writer.xml._percent_to_ooxml import _percent_to_ooxml
from doe_export.pptx.writer.xml._signed_percent_to_ooxml import _signed_percent_to_ooxml
from doe_export.pptx.writer.xml._combined_alpha import _combined_alpha
from doe_export.pptx.writer.assets._merged_image_effects import _merged_image_effects
from doe_export.pptx.writer.geometry._scale_to_ooxml import _scale_to_ooxml
from doe_export.pptx.writer.xml._safe_int import _safe_int
from doe_export.pptx.writer.xml._safe_float import _safe_float
from doe_export.pptx.writer.xml._stop_pos_to_ooxml import _stop_pos_to_ooxml
from doe_export.pptx.writer.shape._gradient_angle_to_ooxml import _gradient_angle_to_ooxml
from doe_export.pptx.writer.assets._image_suffix import _image_suffix
