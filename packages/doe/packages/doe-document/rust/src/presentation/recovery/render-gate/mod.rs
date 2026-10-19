use serde::{Deserialize, Serialize};


pub const RENDER_GATE_CONTRACT: &str = "yrkie-slide-repair-render-gate-v1";

const ACCEPTED_ADAPTIVE_DIAGNOSTICS: &[&str] = &[
    "alternating-media-text-cards-paired",
    "capacity-packed",
    "collection-capacity-chunked",
    "depth-exited-composition",
    "implicit-planning-group-flattened",
    "invalid-collection-exited",
    "locked-collection-membership-mismatch",
    "nested-collection-flattened",
    "root-heading-support-grouped",
    "same-axis-flattened",
    "same-type-collection-normalized",
    "singleton-cluster-preserved",
    "singleton-collapsed",
    "singleton-collection-collapsed",
    "singleton-exited-composition",
];


#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SlideRenderGatePage {
    pub page_index: usize,
    pub deterministic: bool,
    pub compiled_sha256: String,
    pub hard_diagnostics: Vec<String>,
    pub repair_diagnostics: Vec<String>,
    pub adaptive_diagnostics: Vec<String>,
    pub business_preserved: bool,
    pub missing_business_facts: u64,
    pub source_business_sha256: String,
    pub compiled_business_sha256: String,
    pub report: Option<SlideRenderLayoutReport>,
    pub accepted: bool,
}


#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SlideRenderGateReport {
    pub success: bool,
    pub contract: String,
    pub pages: Vec<SlideRenderGatePage>,
}


#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SlideRenderLayoutReport {
    pub fits: bool,
    pub overflow_x: u64,
    pub overflow_y: u64,
    pub overlaps: u64,
    pub min_width_violations: u64,
    pub min_height_violations: u64,
    #[serde(default)]
    pub compression_fit_violations: u64,
    #[serde(default)]
    pub semantic_wrap_violations: u64,
    #[serde(default)]
    pub min_font_violations: u64,
}
#[path = "validate-report/mod.rs"]
mod function_validate_report;
pub use function_validate_report::validate_report;

#[path = "valid-page-report/mod.rs"]
mod function_valid_page_report;
 use function_valid_page_report::valid_page_report;

#[path = "render-rejection/mod.rs"]
mod function_render_rejection;
pub use function_render_rejection::render_rejection;

