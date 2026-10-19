use super::*;

use crate::presentation::schema::contract::SlideDeckExpectations;

use serde_json::{json, Value};

#[path = "explicit-final-response/mod.rs"]
mod explicit_final_response;
#[path = "valid-deck/mod.rs"]
mod function_valid_deck;
 use function_valid_deck::valid_deck;

#[path = "valid-deck-with-slide-count/mod.rs"]
mod function_valid_deck_with_slide_count;
 use function_valid_deck_with_slide_count::valid_deck_with_slide_count;

#[path = "process-with-slide-count/mod.rs"]
mod function_process_with_slide_count;
 use function_process_with_slide_count::process_with_slide_count;

#[path = "process-one/mod.rs"]
mod function_process_one;
 use function_process_one::process_one;

#[path = "passes-plain-json-without-an-operation/mod.rs"]
mod function_passes_plain_json_without_an_operation;

#[path = "accepts-the-exact-expected-slide-count-after-relaxed-parsing/mod.rs"]
mod function_accepts_the_exact_expected_slide_count_after_relaxed_parsing;

#[path = "rejects-one-fewer-slide-than-expected-after-relaxed-parsing/mod.rs"]
mod function_rejects_one_fewer_slide_than_expected_after_relaxed_parsing;

#[path = "rejects-one-more-slide-than-expected-after-relaxed-parsing/mod.rs"]
mod function_rejects_one_more_slide_than_expected_after_relaxed_parsing;

#[path = "removes-theme-managed-style-and-spacing-fields-without-changing-content/mod.rs"]
mod function_removes_theme_managed_style_and_spacing_fields_without_changing_content;

#[path = "normalizes-direct-collection-content-arrays-without-changing-items/mod.rs"]
mod function_normalizes_direct_collection_content_arrays_without_changing_items;

#[path = "normalizes-flat-collection-wrapper-without-overwriting-canonical-content/mod.rs"]
mod function_normalizes_flat_collection_wrapper_without_overwriting_canonical_content;

#[path = "production-acceptance-no-longer-rejects-component-schema-details/mod.rs"]
mod function_production_acceptance_no_longer_rejects_component_schema_details;

#[path = "production-acceptance-ignores-all-doe-content-and-structure-validators/mod.rs"]
mod function_production_acceptance_ignores_all_doe_content_and_structure_validators;

#[path = "disabled-v2-skips-normalization-but-does-not-restore-schema-rejection/mod.rs"]
mod function_disabled_v2_skips_normalization_but_does_not_restore_schema_rejection;

#[path = "removes-one-json-fence-for-lf-crlf-and-case-insensitive-label/mod.rs"]
mod function_removes_one_json_fence_for_lf_crlf_and_case_insensitive_label;

#[path = "preserves-backticks-inside-a-json-string/mod.rs"]
mod function_preserves_backticks_inside_a_json_string;

#[path = "repairs-a-unique-missing-comma-without-changing-slide-content/mod.rs"]
mod function_repairs_a_unique_missing_comma_without_changing_slide_content;

#[path = "repairs-a-production-shaped-missing-comma-between-slide-blocks/mod.rs"]
mod function_repairs_a_production_shaped_missing_comma_between_slide_blocks;

#[path = "disabled-v2-does-not-repair-a-missing-comma/mod.rs"]
mod function_disabled_v2_does_not_repair_a_missing_comma;

#[path = "rejects-prose-wrapped-or-multiple-json-values-instead-of-guessing/mod.rs"]
mod function_rejects_prose_wrapped_or_multiple_json_values_instead_of_guessing;

#[path = "rejects-ambiguous-or-non-json-fences/mod.rs"]
mod function_rejects_ambiguous_or_non_json_fences;

#[path = "disabled-v2-does-not-strip-a-fence/mod.rs"]
mod function_disabled_v2_does_not_strip_a_fence;

#[path = "production-parser-accepts-duplicate-keys-but-rejects-unapproved-image-sources/mod.rs"]
mod function_production_parser_accepts_duplicate_keys_but_rejects_unapproved_image_sources;

#[path = "replays-external-json-fence-without-repairing-duplicate-keys/mod.rs"]
mod function_replays_external_json_fence_without_repairing_duplicate_keys;

