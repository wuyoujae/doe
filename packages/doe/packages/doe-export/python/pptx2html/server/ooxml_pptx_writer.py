"""Public compatibility API for the modular DOE pptx/ooxml engine."""
from __future__ import annotations
from doe_export.pptx.ooxml.shared import (
    A,
    ASVG,
    Any,
    CT,
    EMU_PER_PT,
    ET,
    IMAGE_REL_TYPE,
    InvalidTextLayoutSnapshot,
    MAX_IMAGE_PAYLOAD_BYTES,
    MC,
    NOTES_SLIDE_REL_TYPE,
    OOXML_PERCENT_MAX,
    OOXML_PERCENT_MIN,
    P,
    PILImage,
    PPTX_NATIVE_IMAGE_TYPES,
    Path,
    R,
    REL,
    RESERVED_GENERATED_PREFIX_RE,
    SLIDE_REL_TYPE,
    SVG_BLIP_EXT_URI,
    SVG_PATH_TOKEN_RE,
    TABLE_URI,
    UnidentifiedImageError,
    XML,
    XMLNS_DECL_RE,
    copy,
    dataclass,
    has_image_payload,
    image_payload,
    io,
    json,
    make_text_container_metrics,
    materialize_layout_snapshot,
    math,
    normalize_htmlir_export_line_edges,
    parse_xml,
    posixpath,
    re,
    read_archive_entry,
    validate_pptx_archive,
    zipfile,
)
from doe_export.pptx.ooxml.package.RoundtripFallbackRequired import RoundtripFallbackRequired
from doe_export.pptx.ooxml.assets.export_ready_image_payload import export_ready_image_payload
from doe_export.pptx.ooxml.package.write_roundtrip_pptx_from_ir import write_roundtrip_pptx_from_ir
from doe_export.pptx.ooxml.package._safe_roundtrip_source_indexes import _safe_roundtrip_source_indexes
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.package.OoxmlPackage import OoxmlPackage
from doe_export.pptx.ooxml.shape.build_shape_element import build_shape_element
from doe_export.pptx.ooxml.shape.patch_shape_element import patch_shape_element
from doe_export.pptx.ooxml.shape.patch_group_shape import patch_group_shape
from doe_export.pptx.ooxml.shape.group_child_shape_in_ooxml_space import group_child_shape_in_ooxml_space
from doe_export.pptx.ooxml.geometry.build_group_xfrm import build_group_xfrm
from doe_export.pptx.ooxml.xml.finite_number import finite_number
from doe_export.pptx.ooxml.geometry.format_shape_path import format_shape_path
from doe_export.pptx.ooxml.xml.patch_picture import patch_picture
from doe_export.pptx.ooxml.shape.patch_common_shape_props import patch_common_shape_props
from doe_export.pptx.ooxml.geometry.patch_graphic_frame_xfrm import patch_graphic_frame_xfrm
from doe_export.pptx.ooxml.shape.build_auto_shape import build_auto_shape
from doe_export.pptx.ooxml.xml.build_connector import build_connector
from doe_export.pptx.ooxml.xml.build_picture import build_picture
from doe_export.pptx.ooxml.table.build_table_graphic_frame import build_table_graphic_frame
from doe_export.pptx.ooxml.table.build_table import build_table
from doe_export.pptx.ooxml.table.build_table_cell import build_table_cell
from doe_export.pptx.ooxml.xml.write_slide_transition import write_slide_transition
from doe_export.pptx.ooxml.xml.safe_transition_type import safe_transition_type
from doe_export.pptx.ooxml.xml.transition_direction_attr import transition_direction_attr
from doe_export.pptx.ooxml.xml.insert_slide_child_before import insert_slide_child_before
from doe_export.pptx.ooxml.geometry.write_geometry import write_geometry
from doe_export.pptx.ooxml.geometry.build_custom_geometry import build_custom_geometry
from doe_export.pptx.ooxml.geometry.append_svg_path_commands import append_svg_path_commands
from doe_export.pptx.ooxml.text.replace_text_body import replace_text_body
from doe_export.pptx.ooxml.text.build_text_body import build_text_body
from doe_export.pptx.ooxml.xml.build_body_pr import build_body_pr
from doe_export.pptx.ooxml.text.build_paragraph import build_paragraph
from doe_export.pptx.ooxml.shape.build_line_spacing import build_line_spacing
from doe_export.pptx.ooxml.geometry._line_spacing_points import _line_spacing_points
from doe_export.pptx.ooxml.shape._line_spacing_percent import _line_spacing_percent
from doe_export.pptx.ooxml.text.build_run_properties import build_run_properties
from doe_export.pptx.ooxml.text.write_text_underline_details import write_text_underline_details
from doe_export.pptx.ooxml.shape.underline_to_dash import underline_to_dash
from doe_export.pptx.ooxml.text.text_needs_xml_space import text_needs_xml_space
from doe_export.pptx.ooxml.shape.write_fill import write_fill
from doe_export.pptx.ooxml.xml.write_slide_background import write_slide_background
from doe_export.pptx.ooxml.shape.write_gradient_fill import write_gradient_fill
from doe_export.pptx.ooxml.shape.write_pattern_fill import write_pattern_fill
from doe_export.pptx.ooxml.shape.write_picture_fill import write_picture_fill
from doe_export.pptx.ooxml.package.preserve_source_picture_fill import preserve_source_picture_fill
from doe_export.pptx.ooxml.shape.patch_preserved_picture_fill import patch_preserved_picture_fill
from doe_export.pptx.ooxml.shape.write_blip_fill_layout import write_blip_fill_layout
from doe_export.pptx.ooxml.geometry.rewrite_svg_blip_extensions import rewrite_svg_blip_extensions
from doe_export.pptx.ooxml.xml.write_blip_alpha import write_blip_alpha
from doe_export.pptx.ooxml.assets.image_payload_changed import image_payload_changed
from doe_export.pptx.ooxml.assets.write_blip_image_effects import write_blip_image_effects
from doe_export.pptx.ooxml.xml.append_blip_effect_child import append_blip_effect_child
from doe_export.pptx.ooxml.shape.write_line import write_line
from doe_export.pptx.ooxml.shape.write_shadow import write_shadow
from doe_export.pptx.ooxml.shape.shadow_direction_attr import shadow_direction_attr
from doe_export.pptx.ooxml.shape.build_line import build_line
from doe_export.pptx.ooxml.geometry.build_xfrm import build_xfrm
from doe_export.pptx.ooxml.geometry.replace_xfrm import replace_xfrm
from doe_export.pptx.ooxml.xml.write_src_rect import write_src_rect
from doe_export.pptx.ooxml.xml.replace_direct_child import replace_direct_child
from doe_export.pptx.ooxml.xml.find_or_create import find_or_create
from doe_export.pptx.ooxml.shape.split_shape_tree_children import split_shape_tree_children
from doe_export.pptx.ooxml.shape.map_original_shapes_to_elements import map_original_shapes_to_elements
from doe_export.pptx.ooxml.shape.find_matching_original_shape import find_matching_original_shape
from doe_export.pptx.ooxml.shape.shape_identity import shape_identity
from doe_export.pptx.ooxml.shape.shape_type_identity import shape_type_identity
from doe_export.pptx.ooxml.shape.shape_matches_element import shape_matches_element
from doe_export.pptx.ooxml.shape.shape_type_matches_element import shape_type_matches_element
from doe_export.pptx.ooxml.shape.is_shape_element import is_shape_element
from doe_export.pptx.ooxml.shape.shape_id_from_element import shape_id_from_element
from doe_export.pptx.ooxml.shape.shape_ids_from_elements import shape_ids_from_elements
from doe_export.pptx.ooxml.shape.shape_ids_from_ir import shape_ids_from_ir
from doe_export.pptx.ooxml.package.parse_relationships import parse_relationships
from doe_export.pptx.ooxml.package.next_relationship_id import next_relationship_id
from doe_export.pptx.ooxml.xml.rels_part_name import rels_part_name
from doe_export.pptx.ooxml.package.source_part_name_from_rels import source_part_name_from_rels
from doe_export.pptx.ooxml.xml.join_part_target import join_part_target
from doe_export.pptx.ooxml.xml.relative_target import relative_target
from doe_export.pptx.ooxml.package.relationship_ids_in_xml import relationship_ids_in_xml
from doe_export.pptx.ooxml.xml.remove_children import remove_children
from doe_export.pptx.ooxml.shape.insert_fill_child import insert_fill_child
from doe_export.pptx.ooxml.xml.append_effect_child import append_effect_child
from doe_export.pptx.ooxml.xml.normalized_track_sizes import normalized_track_sizes
from doe_export.pptx.ooxml.text.shape_text_container_metrics import shape_text_container_metrics
from doe_export.pptx.ooxml.table.table_cell_text_container_metrics import table_cell_text_container_metrics
from doe_export.pptx.ooxml.text._make_text_container_metrics import _make_text_container_metrics
from doe_export.pptx.ooxml.text.plain_text_frame import plain_text_frame
from doe_export.pptx.ooxml.shape.shape_changed import shape_changed
from doe_export.pptx.ooxml.xml.canonical import canonical
from doe_export.pptx.ooxml.text.is_text_box import is_text_box
from doe_export.pptx.ooxml.text.text_anchor import text_anchor
from doe_export.pptx.ooxml.xml.bool_value import bool_value
from doe_export.pptx.ooxml.xml.pt_to_emu import pt_to_emu
from doe_export.pptx.ooxml.xml.clean_hex import clean_hex
from doe_export.pptx.ooxml.xml.append_srgb_color import append_srgb_color
from doe_export.pptx.ooxml.xml.percent_attr import percent_attr
from doe_export.pptx.ooxml.geometry.scale_percent_attr import scale_percent_attr
from doe_export.pptx.ooxml.xml.rect_percent_attrs import rect_percent_attrs
from doe_export.pptx.ooxml.xml.signed_percent_attr import signed_percent_attr
from doe_export.pptx.ooxml.xml.combined_alpha import combined_alpha
from doe_export.pptx.ooxml.assets.merged_image_effects import merged_image_effects
from doe_export.pptx.ooxml.xml.safe_float import safe_float
from doe_export.pptx.ooxml.xml.safe_int import safe_int
from doe_export.pptx.ooxml.xml.ooxml_coord import ooxml_coord
from doe_export.pptx.ooxml.assets.image_extension import image_extension
from doe_export.pptx.ooxml.package.register_source_namespaces import register_source_namespaces
from doe_export.pptx.ooxml.xml.register_namespace import register_namespace
from doe_export.pptx.ooxml.xml.xml_bytes import xml_bytes
from doe_export.pptx.ooxml.xml.qn import qn
