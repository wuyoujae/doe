use super::{
    canonical_value_sha256, render_diagnostic, RecoveredSlideDeck, SlideDiagnostic,
    SlidePageRepairPlan, SlidePageReplacement,
};

use serde::Serialize;

use serde_json::Value;

use std::collections::BTreeSet;


#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SlideGroundingPageProof {
    pub page_index: usize,
    pub outline_page_sha256: String,
    pub slide_sha256: String,
    pub outline_anchor_count: usize,
    pub slide_anchor_count: usize,
    pub shared_anchor_count: usize,
    pub unsupported_number_count: usize,
    pub unsupported_url_count: usize,
    pub unsupported_attribution_count: usize,
    pub accepted: bool,
}


#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SlideGroundingProof {
    pub confirmed_outline_sha256: String,
    pub pages: Vec<SlideGroundingPageProof>,
    pub success: bool,
}
#[path = "factual-claim-policy/mod.rs"]
mod function_factual_claim_policy;
pub(crate) use function_factual_claim_policy::factual_claim_policy;

#[path = "synthetic-data-allowed/mod.rs"]
mod function_synthetic_data_allowed;
 use function_synthetic_data_allowed::synthetic_data_allowed;

#[path = "has-synthetic-label/mod.rs"]
mod function_has_synthetic_label;
 use function_has_synthetic_label::has_synthetic_label;

#[path = "add-synthetic-labels/mod.rs"]
mod function_add_synthetic_labels;
 use function_add_synthetic_labels::add_synthetic_labels;

#[path = "evaluate/mod.rs"]
mod function_evaluate;
pub use function_evaluate::evaluate;

#[path = "rejected-diagnostics/mod.rs"]
mod function_rejected_diagnostics;
pub use function_rejected_diagnostics::rejected_diagnostics;



#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReplacementProvenanceMode {
    Targeted,
    Clean,
}
#[path = "validate-page-replacement-provenance/mod.rs"]
mod function_validate_page_replacement_provenance;
pub use function_validate_page_replacement_provenance::validate_page_replacement_provenance;

#[path = "text-is-composed-from-sources/mod.rs"]
mod function_text_is_composed_from_sources;
 use function_text_is_composed_from_sources::text_is_composed_from_sources;



#[derive(Default)]
struct GuardedFacts {
    numbers: BTreeSet<String>,
    urls: BTreeSet<String>,
    attributions: BTreeSet<String>,
    strings: BTreeSet<String>,
}
#[path = "collect-outline-guarded-facts/mod.rs"]
mod function_collect_outline_guarded_facts;
 use function_collect_outline_guarded_facts::collect_outline_guarded_facts;

#[path = "collect-outline-body-facts/mod.rs"]
mod function_collect_outline_body_facts;
 use function_collect_outline_body_facts::collect_outline_body_facts;

#[path = "collect-delegation-guarded-facts/mod.rs"]
mod function_collect_delegation_guarded_facts;
 use function_collect_delegation_guarded_facts::collect_delegation_guarded_facts;

#[path = "collect-slide-guarded-facts/mod.rs"]
mod function_collect_slide_guarded_facts;
 use function_collect_slide_guarded_facts::collect_slide_guarded_facts;

#[path = "collect-slide-business-value/mod.rs"]
mod function_collect_slide_business_value;
 use function_collect_slide_business_value::collect_slide_business_value;

#[path = "add-value-unit-alias/mod.rs"]
mod function_add_value_unit_alias;
 use function_add_value_unit_alias::add_value_unit_alias;

#[path = "add-dimension-value-aliases/mod.rs"]
mod function_add_dimension_value_aliases;
 use function_add_dimension_value_aliases::add_dimension_value_aliases;

#[path = "add-series-data-unit-aliases/mod.rs"]
mod function_add_series_data_unit_aliases;
 use function_add_series_data_unit_aliases::add_series_data_unit_aliases;

#[path = "number-value/mod.rs"]
mod function_number_value;
 use function_number_value::number_value;

#[path = "currency-unit/mod.rs"]
mod function_currency_unit;
 use function_currency_unit::currency_unit;

#[path = "add-unit-number-aliases/mod.rs"]
mod function_add_unit_number_aliases;
 use function_add_unit_number_aliases::add_unit_number_aliases;

#[path = "scale-decimal/mod.rs"]
mod function_scale_decimal;
 use function_scale_decimal::scale_decimal;

#[path = "insert-number-fact/mod.rs"]
mod function_insert_number_fact;
 use function_insert_number_fact::insert_number_fact;

#[path = "insert-string-fact/mod.rs"]
mod function_insert_string_fact;
 use function_insert_string_fact::insert_string_fact;

#[path = "strip-display-ordinal-prefix/mod.rs"]
mod function_strip_display_ordinal_prefix;
 use function_strip_display_ordinal_prefix::strip_display_ordinal_prefix;

#[path = "is-outline-control-key/mod.rs"]
mod function_is_outline_control_key;
pub(crate) use function_is_outline_control_key::is_outline_control_key;

#[path = "is-slide-business-key/mod.rs"]
mod function_is_slide_business_key;
 use function_is_slide_business_key::is_slide_business_key;

#[path = "is-attribution-key/mod.rs"]
mod function_is_attribution_key;
 use function_is_attribution_key::is_attribution_key;

#[path = "is-url/mod.rs"]
mod function_is_url;
 use function_is_url::is_url;

#[path = "number-tokens/mod.rs"]
mod function_number_tokens;
 use function_number_tokens::number_tokens;

#[path = "canonical-number-token/mod.rs"]
mod function_canonical_number_token;
 use function_canonical_number_token::canonical_number_token;



#[derive(Debug, Clone, Copy)]
enum AnchorSource {
    Outline,
    Slide,
}
#[path = "semantic-anchors/mod.rs"]
mod function_semantic_anchors;
 use function_semantic_anchors::semantic_anchors;

#[path = "normalize/mod.rs"]
mod function_normalize;
 use function_normalize::normalize;



#[cfg(test)]
#[path = "tests/mod.rs"]
mod tests;

