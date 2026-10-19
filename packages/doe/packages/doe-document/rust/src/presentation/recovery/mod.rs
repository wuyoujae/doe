use doe_core::json::duplicate as duplicate_json;
use serde::Serialize;

use serde_json::{json, Map, Value};

use sha2::{Digest, Sha256};

use std::collections::{BTreeSet, HashMap, HashSet};


use crate::presentation::schema::contract::{
    self as slide_agent_output_contract, ParsedSlideDeck, SlideDeckExpectations, INVALID_JSON_ERROR,
};

pub mod grounding;

#[path = "model-io/mod.rs"]
pub mod model_io;

#[path = "render-gate/mod.rs"]
pub mod render_gate;


const MAX_DETERMINISTIC_EDITS: usize = 128;


#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum SlideRecoveryDisposition {
    Original,
    DeterministicRepair,
    AiPageRepair,
    DeterministicFallback,
}


#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum SlideRepairability {
    AlreadyValid,
    GrammarUnique,
    ContractUnique,
    RequiresPageRepair,
    HardFailure,
}


#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SlideDiagnostic {
    pub code: String,
    pub path: String,
    pub message: String,
    pub page_index: Option<usize>,
    pub repairability: SlideRepairability,
}


#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SlideRepairEdit {
    pub code: String,
    pub path: String,
    pub action: String,
    pub page_index: Option<usize>,
    pub before_sha256: String,
    pub after_sha256: String,
    pub constraint: String,
}


#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct FrozenSlideProof {
    pub page_index: usize,
    pub slide_id: String,
    pub before_sha256: String,
    pub after_sha256: String,
}


#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SlideModelAttemptProof {
    pub attempt_index: usize,
    pub mode: String,
    pub outcome: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response_sha256: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response_bytes: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider_generation_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider_generation_id_sha256: Option<String>,
    pub token_consumption: u64,
}


#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SlideRepairProof {
    pub disposition: SlideRecoveryDisposition,
    pub original_sha256: String,
    pub candidate_sha256: String,
    pub original_error: Option<String>,
    pub diagnostics: Vec<SlideDiagnostic>,
    pub edits: Vec<SlideRepairEdit>,
    pub frozen_slides: Vec<FrozenSlideProof>,
    pub image_source_repair_count: usize,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub model_attempts: Vec<SlideModelAttemptProof>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub render_validation: Option<render_gate::SlideRenderGateReport>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub grounding_validation: Option<grounding::SlideGroundingProof>,
}


#[derive(Debug, Clone)]
pub struct RecoveredSlideDeck {
    pub parsed: ParsedSlideDeck,
    pub proof: SlideRepairProof,
}


#[derive(Debug, Clone, Serialize)]
pub struct SlidePageRepairTarget {
    pub page_index: usize,
    pub slide_id: String,
    pub page_sha256: String,
    pub diagnostics: Vec<SlideDiagnostic>,
    pub slide: Value,
}


#[derive(Debug, Clone)]
pub struct SlidePageRepairPlan {
    pub original_sha256: String,
    pub base_deck_sha256: String,
    pub candidate: Value,
    pub targets: Vec<SlidePageRepairTarget>,
    pub frozen_slides: Vec<FrozenSlideProof>,
    pub diagnostics: Vec<SlideDiagnostic>,
    pub deterministic_edits: Vec<SlideRepairEdit>,
    pub image_source_repair_count: usize,
}


#[derive(Debug, Clone, Serialize)]
pub struct SlidePageReplacement {
    pub page_index: usize,
    pub expected_page_sha256: String,
    pub slide: Value,
}
#[path = "recover-agent-deck/mod.rs"]
mod function_recover_agent_deck;
pub use function_recover_agent_deck::recover_agent_deck;

#[path = "accept-original-agent-deck/mod.rs"]
mod function_accept_original_agent_deck;
pub use function_accept_original_agent_deck::accept_original_agent_deck;

#[path = "parsed-matches-strict-input/mod.rs"]
mod function_parsed_matches_strict_input;
 use function_parsed_matches_strict_input::parsed_matches_strict_input;

#[path = "original-recovered-deck/mod.rs"]
mod function_original_recovered_deck;
 use function_original_recovered_deck::original_recovered_deck;

#[path = "repair-known-renderer-incompatibilities/mod.rs"]
mod function_repair_known_renderer_incompatibilities;
pub use function_repair_known_renderer_incompatibilities::repair_known_renderer_incompatibilities;

#[path = "repair-known-renderer-slide/mod.rs"]
mod function_repair_known_renderer_slide;
 use function_repair_known_renderer_slide::repair_known_renderer_slide;

#[path = "repair-known-renderer-nodes/mod.rs"]
mod function_repair_known_renderer_nodes;
 use function_repair_known_renderer_nodes::repair_known_renderer_nodes;

#[path = "contradictory-cluster-grid-stack/mod.rs"]
mod function_contradictory_cluster_grid_stack;
 use function_contradictory_cluster_grid_stack::contradictory_cluster_grid_stack;

#[path = "repeated-cluster-composition-columns/mod.rs"]
mod function_repeated_cluster_composition_columns;
 use function_repeated_cluster_composition_columns::repeated_cluster_composition_columns;

#[path = "node-structure-signature/mod.rs"]
mod function_node_structure_signature;
 use function_node_structure_signature::node_structure_signature;

#[path = "collect-node-ids/mod.rs"]
mod function_collect_node_ids;
 use function_collect_node_ids::collect_node_ids;

#[path = "unique-derived-id/mod.rs"]
mod function_unique_derived_id;
 use function_unique_derived_id::unique_derived_id;

#[path = "normalized-business-text/mod.rs"]
mod function_normalized_business_text;
 use function_normalized_business_text::normalized_business_text;

#[path = "plan-page-repairs/mod.rs"]
mod function_plan_page_repairs;
pub use function_plan_page_repairs::plan_page_repairs;

#[path = "plan-full-page-regeneration/mod.rs"]
mod function_plan_full_page_regeneration;
pub use function_plan_full_page_regeneration::plan_full_page_regeneration;

#[path = "plan-render-page-repairs/mod.rs"]
mod function_plan_render_page_repairs;
pub use function_plan_render_page_repairs::plan_render_page_repairs;

#[path = "plan-grounding-page-repairs/mod.rs"]
mod function_plan_grounding_page_repairs;
pub use function_plan_grounding_page_repairs::plan_grounding_page_repairs;

#[path = "plan-valid-candidate-page-repairs/mod.rs"]
mod function_plan_valid_candidate_page_repairs;
 use function_plan_valid_candidate_page_repairs::plan_valid_candidate_page_repairs;

#[path = "accept-render-validation/mod.rs"]
mod function_accept_render_validation;
pub use function_accept_render_validation::accept_render_validation;

#[path = "accept-grounding-validation/mod.rs"]
mod function_accept_grounding_validation;
pub use function_accept_grounding_validation::accept_grounding_validation;

#[path = "enforce-grounded-deck-title/mod.rs"]
mod function_enforce_grounded_deck_title;
pub use function_enforce_grounded_deck_title::enforce_grounded_deck_title;

#[path = "render-diagnostic/mod.rs"]
mod function_render_diagnostic;
 use function_render_diagnostic::render_diagnostic;

#[path = "apply-page-replacements/mod.rs"]
mod function_apply_page_replacements;
pub use function_apply_page_replacements::apply_page_replacements;

#[path = "recover-failed-candidate/mod.rs"]
mod function_recover_failed_candidate;
 use function_recover_failed_candidate::recover_failed_candidate;

#[path = "prepare-recovery-candidate/mod.rs"]
mod function_prepare_recovery_candidate;
 use function_prepare_recovery_candidate::prepare_recovery_candidate;

#[path = "unique-embedded-deck-object/mod.rs"]
mod function_unique_embedded_deck_object;
 use function_unique_embedded_deck_object::unique_embedded_deck_object;

#[path = "contract-normalization-edit/mod.rs"]
mod function_contract_normalization_edit;
 use function_contract_normalization_edit::contract_normalization_edit;

#[path = "candidate-shape-rank/mod.rs"]
mod function_candidate_shape_rank;
 use function_candidate_shape_rank::candidate_shape_rank;

#[path = "repair-contract-unique-fields/mod.rs"]
mod function_repair_contract_unique_fields;
 use function_repair_contract_unique_fields::repair_contract_unique_fields;

#[path = "repair-root-controls/mod.rs"]
mod function_repair_root_controls;
 use function_repair_root_controls::repair_root_controls;

#[path = "repair-slide-semantics/mod.rs"]
mod function_repair_slide_semantics;
 use function_repair_slide_semantics::repair_slide_semantics;

#[path = "repair-slide-canvas/mod.rs"]
mod function_repair_slide_canvas;
 use function_repair_slide_canvas::repair_slide_canvas;

#[path = "repair-node-semantics/mod.rs"]
mod function_repair_node_semantics;
 use function_repair_node_semantics::repair_node_semantics;

#[path = "explode-plural-leaf-collection/mod.rs"]
mod function_explode_plural_leaf_collection;
 use function_explode_plural_leaf_collection::explode_plural_leaf_collection;

#[path = "normalize-legacy-stat-renderer-props/mod.rs"]
mod function_normalize_legacy_stat_renderer_props;
 use function_normalize_legacy_stat_renderer_props::normalize_legacy_stat_renderer_props;

#[path = "leaf-props-satisfy-contract/mod.rs"]
mod function_leaf_props_satisfy_contract;
 use function_leaf_props_satisfy_contract::leaf_props_satisfy_contract;

#[path = "downgrade-over-capacity-text-collection/mod.rs"]
mod function_downgrade_over_capacity_text_collection;
 use function_downgrade_over_capacity_text_collection::downgrade_over_capacity_text_collection;

#[path = "textual-collection-contract/mod.rs"]
mod function_textual_collection_contract;
 use function_textual_collection_contract::textual_collection_contract;

#[path = "project-textual-collection-item/mod.rs"]
mod function_project_textual_collection_item;
 use function_project_textual_collection_item::project_textual_collection_item;

#[path = "collect-projectable-business-values/mod.rs"]
mod function_collect_projectable_business_values;
 use function_collect_projectable_business_values::collect_projectable_business_values;

#[path = "deduplicate-projection-values/mod.rs"]
mod function_deduplicate_projection_values;
 use function_deduplicate_projection_values::deduplicate_projection_values;

#[path = "repair-against-schema/mod.rs"]
mod function_repair_against_schema;
 use function_repair_against_schema::repair_against_schema;

#[path = "resolve-schema-branch/mod.rs"]
mod function_resolve_schema_branch;
 use function_resolve_schema_branch::resolve_schema_branch;

#[path = "select-schema-branch/mod.rs"]
mod function_select_schema_branch;
 use function_select_schema_branch::select_schema_branch;

#[path = "schema-match-score/mod.rs"]
mod function_schema_match_score;
 use function_schema_match_score::schema_match_score;

#[path = "schema-type-matches/mod.rs"]
mod function_schema_type_matches;
 use function_schema_type_matches::schema_type_matches;

#[path = "schema-enum-matches/mod.rs"]
mod function_schema_enum_matches;
 use function_schema_enum_matches::schema_enum_matches;

#[path = "schema-expects-container/mod.rs"]
mod function_schema_expects_container;
 use function_schema_expects_container::schema_expects_container;

#[path = "is-removable-control-field/mod.rs"]
mod function_is_removable_control_field;
 use function_is_removable_control_field::is_removable_control_field;

#[path = "is-supported-leaf-component/mod.rs"]
mod function_is_supported_leaf_component;
 use function_is_supported_leaf_component::is_supported_leaf_component;

#[path = "collect-diagnostics/mod.rs"]
mod function_collect_diagnostics;
 use function_collect_diagnostics::collect_diagnostics;

#[path = "collect-relation-diagnostics/mod.rs"]
mod function_collect_relation_diagnostics;
 use function_collect_relation_diagnostics::collect_relation_diagnostics;

#[path = "collect-node-relation-diagnostics/mod.rs"]
mod function_collect_node_relation_diagnostics;
 use function_collect_node_relation_diagnostics::collect_node_relation_diagnostics;

#[path = "push-relation-diagnostic/mod.rs"]
mod function_push_relation_diagnostic;
 use function_push_relation_diagnostic::push_relation_diagnostic;

#[path = "collect-schema-diagnostics/mod.rs"]
mod function_collect_schema_diagnostics;
 use function_collect_schema_diagnostics::collect_schema_diagnostics;

#[path = "push-schema-diagnostic/mod.rs"]
mod function_push_schema_diagnostic;
 use function_push_schema_diagnostic::push_schema_diagnostic;

#[path = "schema-type-label/mod.rs"]
mod function_schema_type_label;
 use function_schema_type_label::schema_type_label;

#[path = "value-type-label/mod.rs"]
mod function_value_type_label;
 use function_value_type_label::value_type_label;

#[path = "is-deterministic-required-control/mod.rs"]
mod function_is_deterministic_required_control;
 use function_is_deterministic_required_control::is_deterministic_required_control;

#[path = "is-empty-control-value/mod.rs"]
mod function_is_empty_control_value;
 use function_is_empty_control_value::is_empty_control_value;

#[path = "diagnostic-from-error/mod.rs"]
mod function_diagnostic_from_error;
 use function_diagnostic_from_error::diagnostic_from_error;

#[path = "page-index-from-path/mod.rs"]
mod function_page_index_from_path;
 use function_page_index_from_path::page_index_from_path;

#[path = "verify-frozen-slides/mod.rs"]
mod function_verify_frozen_slides;
 use function_verify_frozen_slides::verify_frozen_slides;

#[path = "candidate-slides/mod.rs"]
mod function_candidate_slides;
 use function_candidate_slides::candidate_slides;

#[path = "duplicate-slide-id-indices/mod.rs"]
mod function_duplicate_slide_id_indices;
 use function_duplicate_slide_id_indices::duplicate_slide_id_indices;

#[path = "verify-deck-envelope-with-placeholders/mod.rs"]
mod function_verify_deck_envelope_with_placeholders;
 use function_verify_deck_envelope_with_placeholders::verify_deck_envelope_with_placeholders;

#[path = "record-edit/mod.rs"]
mod function_record_edit;
 use function_record_edit::record_edit;

#[path = "slide-id/mod.rs"]
mod function_slide_id;
 use function_slide_id::slide_id;

#[path = "canonical-value-sha256/mod.rs"]
mod function_canonical_value_sha256;
pub use function_canonical_value_sha256::canonical_value_sha256;

#[path = "canonicalize-value/mod.rs"]
mod function_canonicalize_value;
 use function_canonicalize_value::canonicalize_value;

#[path = "sha256-hex/mod.rs"]
mod function_sha256_hex;
 use function_sha256_hex::sha256_hex;



#[cfg(test)]
mod tests;
