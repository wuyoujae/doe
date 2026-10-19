use super::*;
#[path = "doe-direct-decoder-accepts-traditional-outline-v1/mod.rs"]
mod doe_direct_decoder_accepts_traditional_outline_v1;
#[path = "doe-direct-decoder-rejects-code-fences-and-structural-damage/mod.rs"]
mod doe_direct_decoder_rejects_code_fences_and_structural_damage;
#[path = "doe-direct-decoder-rejects-schema-v2-and-unknown-envelope-fields/mod.rs"]
mod doe_direct_decoder_rejects_schema_v2_and_unknown_envelope_fields;
#[path = "doe-production-decoder-accepts-unknown-and-non-v1-content-without-validation/mod.rs"]
mod doe_production_decoder_accepts_unknown_and_non_v1_content_without_validation;
#[path = "doe-production-decoder-recovers-complete-json-markdown-fence/mod.rs"]
mod doe_production_decoder_recovers_complete_json_markdown_fence;
#[path = "doe-production-decoder-recovers-completed-body-with-missing-terminal-closers/mod.rs"]
mod doe_production_decoder_recovers_completed_body_with_missing_terminal_closers;
#[path = "doe-production-decoder-rejects-ambiguous-multiple-json-documents/mod.rs"]
mod doe_production_decoder_rejects_ambiguous_multiple_json_documents;
#[path = "doe-production-decoder-canonicalizes-near-generated-image-marker-names/mod.rs"]
mod doe_production_decoder_canonicalizes_near_generated_image_marker_names;
