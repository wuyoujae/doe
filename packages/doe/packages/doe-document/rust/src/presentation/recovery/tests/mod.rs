use super::*;

use crate::presentation::recovery::render_gate::{
    SlideRenderGatePage, SlideRenderGateReport, SlideRenderLayoutReport,
};

use serde_json::json;
#[path = "expectations/mod.rs"]
mod function_expectations;
 use function_expectations::expectations;

#[path = "valid-slide/mod.rs"]
mod function_valid_slide;
 use function_valid_slide::valid_slide;

#[path = "deck/mod.rs"]
mod function_deck;
 use function_deck::deck;

#[path = "render-page/mod.rs"]
mod function_render_page;
 use function_render_page::render_page;

#[path = "valid-deck-is-never-modified/mod.rs"]
mod function_valid_deck_is_never_modified;

#[path = "known-renderer-legacy-fields-are-migrated-without-losing-business-text/mod.rs"]
mod function_known_renderer_legacy_fields_are_migrated_without_losing_business_text;

#[path = "renderer-normalization-does-not-drop-unknown-business-properties/mod.rs"]
mod function_renderer_normalization_does_not_drop_unknown_business_properties;

#[path = "homogeneous-repeated-card-composition-is-normalized-to-a-grid/mod.rs"]
mod function_homogeneous_repeated_card_composition_is_normalized_to_a_grid;

#[path = "over-capacity-textual-card-collection-falls-back-without-dropping-items/mod.rs"]
mod function_over_capacity_textual_card_collection_falls_back_without_dropping_items;

#[path = "plural-leaf-payload-expands-only-when-every-child-satisfies-the-leaf-contract/mod.rs"]
mod function_plural_leaf_payload_expands_only_when_every_child_satisfies_the_leaf_contract;

#[path = "projection-deduplication-preserves-distinct-symbol-only-values/mod.rs"]
mod function_projection_deduplication_preserves_distinct_symbol_only_values;

#[path = "parser-normalizations-are-audited-as-deterministic-repairs/mod.rs"]
mod function_parser_normalizations_are_audited_as_deterministic_repairs;

#[path = "unique-image-source-correction-is-never-reported-as-original/mod.rs"]
mod function_unique_image_source_correction_is_never_reported_as_original;

#[path = "disabled-recovery-accepts-only-semantically-unchanged-valid-json/mod.rs"]
mod function_disabled_recovery_accepts_only_semantically_unchanged_valid_json;

#[path = "invalid-optional-group-kind-is-removed-without-touching-valid-pages/mod.rs"]
mod function_invalid_optional_group_kind_is_removed_without_touching_valid_pages;

#[path = "diagnostics-collect-multiple-contract-failures-before-repair/mod.rs"]
mod function_diagnostics_collect_multiple_contract_failures_before_repair;

#[path = "diagnostics-collect-all-independent-cross-field-failures-on-one-page/mod.rs"]
mod function_diagnostics_collect_all_independent_cross_field_failures_on_one_page;

#[path = "all-invalid-pages-are-repaired-in-one-bounded-pass/mod.rs"]
mod function_all_invalid_pages_are_repaired_in_one_bounded_pass;

#[path = "stringified-component-items-are-decoded-from-the-contract/mod.rs"]
mod function_stringified_component_items_are_decoded_from_the_contract;

#[path = "required-business-content-is-never-invented/mod.rs"]
mod function_required_business_content_is_never_invented;

#[path = "page-repair-plan-freezes-valid-pages-and-accepts-only-hash-bound-targets/mod.rs"]
mod function_page_repair_plan_freezes_valid_pages_and_accepts_only_hash_bound_targets;

#[path = "renderer-rejection-becomes-a-hash-bound-page-plan-and-freezes-other-pages/mod.rs"]
mod function_renderer_rejection_becomes_a_hash_bound_page_plan_and_freezes_other_pages;

#[path = "accepted-renderer-proof-is-attached-without-changing-canonical-deck/mod.rs"]
mod function_accepted_renderer_proof_is_attached_without_changing_canonical_deck;

#[path = "deck-title-is-grounded-without-changing-any-slide/mod.rs"]
mod function_deck_title_is_grounded_without_changing_any_slide;

#[path = "ungrounded-page-is-replaced-from-outline-without-touching-grounded-page/mod.rs"]
mod function_ungrounded_page_is_replaced_from_outline_without_touching_grounded_page;

#[path = "conflicting-unknown-fields-are-not-silently-dropped/mod.rs"]
mod function_conflicting_unknown_fields_are_not_silently_dropped;

#[path = "json-fence-and-unique-syntax-damage-are-repaired-only-on-recovery-path/mod.rs"]
mod function_json_fence_and_unique_syntax_damage_are_repaired_only_on_recovery_path;

#[path = "equal-duplicate-keys-are-repaired-but-conflicting-duplicates-fail-closed/mod.rs"]
mod function_equal_duplicate_keys_are_repaired_but_conflicting_duplicates_fail_closed;

#[path = "ambiguous-or-wrong-page-count-json-is-not-repaired/mod.rs"]
mod function_ambiguous_or_wrong_page_count_json_is_not_repaired;

#[path = "unusable-primary-output-regenerates-every-page-from-confirmed-outline/mod.rs"]
mod function_unusable_primary_output_regenerates_every_page_from_confirmed_outline;

#[path = "full-regeneration-requires-a-grounded-deck-title/mod.rs"]
mod function_full_regeneration_requires_a_grounded_deck_title;

#[path = "contract-sample/mod.rs"]
mod function_contract_sample;
 use function_contract_sample::contract_sample;

#[path = "break-first-bounded-array/mod.rs"]
mod function_break_first_bounded_array;
 use function_break_first_bounded_array::break_first_bounded_array;

#[path = "contract-derived-mutation-corpus-covers-every-component-and-layout-group/mod.rs"]
mod function_contract_derived_mutation_corpus_covers_every_component_and_layout_group;

