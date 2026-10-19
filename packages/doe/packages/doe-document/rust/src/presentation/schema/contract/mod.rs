use serde::{Deserialize, Serialize};

use serde_json::{json, Map, Value};

use std::collections::{HashMap, HashSet};


pub mod validation;

#[path = "validate-logo/mod.rs"]
mod function_validate_logo;
use function_validate_logo::validate_logo;




pub const EMPTY_OUTPUT_ERROR: &str = "slide_agent_empty_structured_output";

pub const OUTPUT_TOO_LARGE_ERROR: &str = "slide_agent_output_too_large";

pub const INVALID_JSON_ERROR: &str = "slide_agent_invalid_json";

pub use doe_component::schema::SCHEMA_MISMATCH_ERROR;

pub const OUTPUT_CONTRACT_VIOLATION_ERROR: &str = "slide_agent_output_contract_violation";

pub const ASSET_REFERENCE_MISMATCH_ERROR: &str = "slide_agent_asset_reference_mismatch";

pub const GENERATED_IMAGE_PLACEMENT_MISMATCH_ERROR: &str =
    "slide_agent_generated_image_placement_mismatch";


pub const MAX_OUTPUT_BYTES: usize = 8 * 1024 * 1024;

pub const DEFAULT_MAX_OUTPUT_TOKENS: u32 = 65_536;

pub const VISIBLE_REASONING_MAX_TOKENS: u32 = 1_024;

const MAX_SLIDES: usize = 200;

const MAX_NODES_PER_SLIDE: usize = 2_048;

const MAX_NODE_DEPTH: usize = 3;

pub(crate) const MAX_GROUP_CHILDREN: usize = 24;

const MAX_JSON_DELIMITER_REPAIRS: usize = 8;

const MAX_JSON_KEY_QUOTE_REPAIRS: usize = 8;

const MAX_ASSET_REFERENCE_EDIT_DISTANCE: usize = 8;

const STABLE_ASSET_REFERENCE_PREFIXES: [&str; 2] = ["yrkie-asset-data://", "yrkie-asset-base64://"];


const STRUCTURAL_JSON_KEYS: &[&str] = &[
    "version",
    "pageNumber",
    "logo",
    "deck",
    "title",
    "slides",
    "id",
    "size",
    "width",
    "height",
    "unit",
    "theme",
    "editor",
    "background",
    "layout",
    "blocks",
    "type",
    "props",
    "kind",
    "children",
    "content",
];


const AUTHORABLE_COMPONENT_TYPES: &[&str] = &[
    "hero",
    "heading",
    "text",
    "text-panel",
    "code-block",
    "list",
    "ordered-list",
    "todo-list",
    "contents",
    "item-cards",
    "image-text",
    "icon-text",
    "shape-contents",
    "mind-map",
    "3d-funnel",
    "concentric-circles",
    "layered-funnel",
    "folded-arrow",
    "wave-arrow",
    "layered-cube",
    "double-ring",
    "droplet-process",
    "serpentine-process",
    "recycling-arrows",
    "vertical-progress",
    "icon-columns",
    "badge-cards",
    "notice",
    "question-card",
    "stat",
    "quote",
    "media",
    "table",
    "grouped-bar-chart",
    "line-chart",
    "stacked-bar-chart",
    "risk-matrix",
    "waterfall-chart",
    "radar-chart",
    "donut-chart",
    "capability-cards",
    "numbered-icon-cards",
    "math-formula",
];


// Reader compatibility may preserve historical shapes. Circular arrows
// remain readable/editable/exportable in historical Decks, including 4–8 steps.
const COMPONENT_TYPES: &[&str] = &[
    "hero",
    "heading",
    "text",
    "text-panel",
    "code-block",
    "list",
    "ordered-list",
    "todo-list",
    "contents",
    "item-cards",
    "image-text",
    "icon-text",
    "shape-contents",
    "mind-map",
    "3d-funnel",
    "concentric-circles",
    "layered-funnel",
    "folded-arrow",
    "wave-arrow",
    "layered-cube",
    "double-ring",
    "droplet-process",
    "serpentine-process",
    "recycling-arrows",
    "vertical-progress",
    "icon-columns",
    "badge-cards",
    "notice",
    "question-card",
    "stat",
    "quote",
    "media",
    "table",
    "grouped-bar-chart",
    "line-chart",
    "stacked-bar-chart",
    "risk-matrix",
    "waterfall-chart",
    "radar-chart",
    "donut-chart",
    "capability-cards",
    "numbered-icon-cards",
    "math-formula",
];
#[cfg(test)]
#[path = "component-types/mod.rs"]
mod function_component_types;
#[cfg(test)]
pub use function_component_types::component_types;

#[path = "authorable-component-types/mod.rs"]
mod function_authorable_component_types;
pub use function_authorable_component_types::authorable_component_types;



#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SlideDeckExpectations {
    pub slide_count: usize,
}


#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SlidePageNumberFormat {
    Number,
    Fraction,
}


#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct SlidePageNumber {
    pub enabled: bool,
    pub format: SlidePageNumberFormat,
}


impl Default for SlidePageNumber {
    fn default() -> Self {
        Self {
            enabled: true,
            format: SlidePageNumberFormat::Number,
        }
    }
}


#[derive(Debug, Clone)]
pub struct ParsedSlideDeck {
    pub version: i64,
    pub page_number: SlidePageNumber,
    pub logo: Value,
    pub title: String,
    pub theme: String,
    pub slides: Vec<Value>,
    pub canonical_json: String,
    pub image_source_repair_count: usize,
}


impl SlideDeckExpectations {
    pub fn new(slide_count: usize) -> Result<Self, String> {
        if !(1..=MAX_SLIDES).contains(&slide_count) {
            return Err(format!(
                "{OUTPUT_CONTRACT_VIOLATION_ERROR}: expected slide count must be between 1 and {MAX_SLIDES}"
            ));
        }
        Ok(Self { slide_count })
    }
}
#[path = "apply-request-contract/mod.rs"]
mod function_apply_request_contract;
pub use function_apply_request_contract::apply_request_contract;

#[path = "response-format/mod.rs"]
mod function_response_format;
pub use function_response_format::response_format;

#[path = "node-response-schema/mod.rs"]
mod function_node_response_schema;
 use function_node_response_schema::node_response_schema;

#[path = "component-response-schema/mod.rs"]
mod function_component_response_schema;
 use function_component_response_schema::component_response_schema;

pub use doe_component::schema::component_props_response_schema;













#[path = "parse-and-validate/mod.rs"]
mod function_parse_and_validate;
pub use function_parse_and_validate::parse_and_validate;

#[path = "parse-and-validate-deck/mod.rs"]
mod function_parse_and_validate_deck;
pub use function_parse_and_validate_deck::parse_and_validate_deck;

#[path = "parse-and-validate-work-editor-deck/mod.rs"]
mod function_parse_and_validate_work_editor_deck;
pub use function_parse_and_validate_work_editor_deck::parse_and_validate_work_editor_deck;

#[path = "parse-and-validate-agent-deck/mod.rs"]
mod function_parse_and_validate_agent_deck;
pub use function_parse_and_validate_agent_deck::parse_and_validate_agent_deck;

#[path = "collect-stable-asset-references/mod.rs"]
mod function_collect_stable_asset_references;
pub use function_collect_stable_asset_references::collect_stable_asset_references;

#[path = "collect-outline-image-sources/mod.rs"]
mod function_collect_outline_image_sources;
pub use function_collect_outline_image_sources::collect_outline_image_sources;

#[path = "validate-generated-image-asset-placements/mod.rs"]
mod function_validate_generated_image_asset_placements;
pub use function_validate_generated_image_asset_placements::validate_generated_image_asset_placements;

#[path = "parse-and-validate-deck-internal/mod.rs"]
mod function_parse_and_validate_deck_internal;
 use function_parse_and_validate_deck_internal::parse_and_validate_deck_internal;

#[path = "prepare-deck-value-for-validation/mod.rs"]
mod function_prepare_deck_value_for_validation;
pub use function_prepare_deck_value_for_validation::prepare_deck_value_for_validation;

#[path = "validate-deck-value/mod.rs"]
mod function_validate_deck_value;
pub use function_validate_deck_value::validate_deck_value;

#[path = "validate-authorable-deck-value/mod.rs"]
mod function_validate_authorable_deck_value;
pub use function_validate_authorable_deck_value::validate_authorable_deck_value;

#[path = "validate-agent-deck-envelope-value/mod.rs"]
mod function_validate_agent_deck_envelope_value;
pub use function_validate_agent_deck_envelope_value::validate_agent_deck_envelope_value;

#[path = "retained-doe-content-validators/mod.rs"]
mod function_retained_doe_content_validators;


#[path = "reject-authorable-nulls/mod.rs"]
mod function_reject_authorable_nulls;
 use function_reject_authorable_nulls::reject_authorable_nulls;

pub(crate) use doe_component::schema::validate_authorable_enum;

pub(crate) use doe_component::schema::validate_authorable_optional_enum;

pub(crate) use doe_component::schema::validate_authorable_optional_text;

pub(crate) use doe_component::schema::validate_authorable_optional_bool;

pub(crate) use doe_component::schema::validate_authorable_integer_range;

pub(crate) use doe_component::schema::validate_authorable_optional_integer_range;

pub(crate) use doe_component::schema::validate_authorable_optional_number;





#[path = "validate-authorable-background/mod.rs"]
mod function_validate_authorable_background;
 use function_validate_authorable_background::validate_authorable_background;

#[path = "validate-authorable-slide-layout/mod.rs"]
mod function_validate_authorable_slide_layout;
 use function_validate_authorable_slide_layout::validate_authorable_slide_layout;

#[path = "validate-authorable-leaf-layout/mod.rs"]
mod function_validate_authorable_leaf_layout;
 use function_validate_authorable_leaf_layout::validate_authorable_leaf_layout;

#[path = "validate-authorable-group-layout/mod.rs"]
mod function_validate_authorable_group_layout;
 use function_validate_authorable_group_layout::validate_authorable_group_layout;

#[path = "validate-authorable-node/mod.rs"]
mod function_validate_authorable_node;
 use function_validate_authorable_node::validate_authorable_node;







pub(crate) use doe_component::schema::validate_authorable_component_shape;

















pub(crate) use doe_component::schema::validate_authorable_component_values;

#[path = "validate-slide-value/mod.rs"]
mod function_validate_slide_value;
pub use function_validate_slide_value::validate_slide_value;

#[path = "parsed-deck-from-valid-value/mod.rs"]
mod function_parsed_deck_from_valid_value;
pub use function_parsed_deck_from_valid_value::parsed_deck_from_valid_value;

#[path = "parsed-agent-deck-without-schema-validation/mod.rs"]
mod function_parsed_agent_deck_without_schema_validation;
pub use function_parsed_agent_deck_without_schema_validation::parsed_agent_deck_without_schema_validation;

#[path = "normalize-page-number/mod.rs"]
mod function_normalize_page_number;
 use function_normalize_page_number::normalize_page_number;

#[path = "normalize-theme/mod.rs"]
mod function_normalize_theme;
 use function_normalize_theme::normalize_theme;




pub(crate) use doe_component::schema::is_theme_managed_component_style_key;

#[path = "normalize-theme-managed-component-styles/mod.rs"]
mod function_normalize_theme_managed_component_styles;
pub use function_normalize_theme_managed_component_styles::normalize_theme_managed_component_styles;

#[path = "normalize-retired-text-roles/mod.rs"]
mod function_normalize_retired_text_roles;
pub use function_normalize_retired_text_roles::normalize_retired_text_roles;

#[path = "normalize-agent-theme-managed-layout-fields/mod.rs"]
mod function_normalize_agent_theme_managed_layout_fields;
pub use function_normalize_agent_theme_managed_layout_fields::normalize_agent_theme_managed_layout_fields;

#[path = "normalize-agent-component-content-shapes/mod.rs"]
mod function_normalize_agent_component_content_shapes;
pub use function_normalize_agent_component_content_shapes::normalize_agent_component_content_shapes;

#[path = "normalize-agent-image-sources/mod.rs"]
mod function_normalize_agent_image_sources;
 use function_normalize_agent_image_sources::normalize_agent_image_sources;

#[path = "validate-agent-image-sources-strict/mod.rs"]
mod function_validate_agent_image_sources_strict;
pub use function_validate_agent_image_sources_strict::validate_agent_image_sources_strict;

#[path = "is-authoritative-image-source/mod.rs"]
mod function_is_authoritative_image_source;
 use function_is_authoritative_image_source::is_authoritative_image_source;

#[path = "looks-like-managed-asset-reference/mod.rs"]
mod function_looks_like_managed_asset_reference;
 use function_looks_like_managed_asset_reference::looks_like_managed_asset_reference;

#[path = "stable-asset-reference-parts/mod.rs"]
mod function_stable_asset_reference_parts;
 use function_stable_asset_reference_parts::stable_asset_reference_parts;

#[path = "is-canonical-stable-asset-reference/mod.rs"]
mod function_is_canonical_stable_asset_reference;
 use function_is_canonical_stable_asset_reference::is_canonical_stable_asset_reference;

#[path = "is-lower-hex-byte/mod.rs"]
mod function_is_lower_hex_byte;
 use function_is_lower_hex_byte::is_lower_hex_byte;

#[path = "bounded-edit-distance/mod.rs"]
mod function_bounded_edit_distance;
 use function_bounded_edit_distance::bounded_edit_distance;

#[path = "asset-reference-mismatch/mod.rs"]
mod function_asset_reference_mismatch;
 use function_asset_reference_mismatch::asset_reference_mismatch;

#[path = "normalize-redundant-deck-canvas/mod.rs"]
mod function_normalize_redundant_deck_canvas;
 use function_normalize_redundant_deck_canvas::normalize_redundant_deck_canvas;

#[path = "normalize-misplaced-leaf-slot-space/mod.rs"]
mod function_normalize_misplaced_leaf_slot_space;
 use function_normalize_misplaced_leaf_slot_space::normalize_misplaced_leaf_slot_space;

#[path = "normalize-node-slot-space/mod.rs"]
mod function_normalize_node_slot_space;
 use function_normalize_node_slot_space::normalize_node_slot_space;

#[path = "parse-json-with-bounded-delimiter-repair/mod.rs"]
mod function_parse_json_with_bounded_delimiter_repair;
 use function_parse_json_with_bounded_delimiter_repair::parse_json_with_bounded_delimiter_repair;

#[path = "repair-missing-structural-key-quotes/mod.rs"]
mod function_repair_missing_structural_key_quotes;
 use function_repair_missing_structural_key_quotes::repair_missing_structural_key_quotes;

#[path = "repair-missing-json-delimiters/mod.rs"]
mod function_repair_missing_json_delimiters;
 use function_repair_missing_json_delimiters::repair_missing_json_delimiters;

#[path = "streamed-content-bytes/mod.rs"]
mod function_streamed_content_bytes;
pub use function_streamed_content_bytes::streamed_content_bytes;

#[path = "validate-root/mod.rs"]
mod function_validate_root;
 use function_validate_root::validate_root;

#[path = "validate-work-editor-root/mod.rs"]
mod function_validate_work_editor_root;
 use function_validate_work_editor_root::validate_work_editor_root;

#[path = "validate-slide/mod.rs"]
mod function_validate_slide;
 use function_validate_slide::validate_slide;

#[path = "validate-slide-background/mod.rs"]
mod function_validate_slide_background;
 use function_validate_slide_background::validate_slide_background;

#[path = "validate-node/mod.rs"]
mod function_validate_node;
 use function_validate_node::validate_node;

pub(crate) use doe_component::schema::validate_component_props;

pub(crate) use doe_component::schema::reject_theme_managed_component_styles;



















pub(crate) use doe_component::schema::allowed_keys;

pub(crate) use doe_component::schema::required;

pub(crate) use doe_component::schema::object;

pub(crate) use doe_component::schema::array;

pub(crate) use doe_component::schema::nonempty_text;

#[path = "identifier/mod.rs"]
mod function_identifier;
 use function_identifier::identifier;

pub(crate) use doe_component::schema::required_text;


pub(crate) use doe_component::schema::finite_number;





pub(crate) use doe_component::schema::mismatch;



#[cfg(test)]
#[path = "tests/mod.rs"]
mod tests;


/// Theme IDs are shared with the browser registry.
pub fn registered_theme_ids() -> &'static [String] {
    static IDS: std::sync::OnceLock<Vec<String>> = std::sync::OnceLock::new();
    IDS.get_or_init(|| serde_json::from_str(include_str!("../../../../../../doe-theme/src/registry/ids.json")).expect("theme registry"))
}

/// Unknown legacy IDs use the default.
pub fn registered_theme_id(value: Option<&str>) -> &'static str {
    let requested = value.unwrap_or("").trim();
    registered_theme_ids().iter().find(|id| id.as_str() == requested).map(String::as_str).unwrap_or("yrkie-theme")
}
