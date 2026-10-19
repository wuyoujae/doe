use serde::Serialize;


use crate::presentation::schema::contract::ParsedSlideDeck;


pub const SLIDE_AUTO_REPAIR_V2_VERSION: &str = "slide-auto-repair-v2";


#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum SlideAutoRepairV2Operation {
    MarkdownCompiled,
    ExplicitFinalJsonSelected,
    JsonCodeFenceRemoved,
    JsonSyntaxRepaired,
    ThemeManagedFieldsRemoved,
    ComponentContentShapeNormalized,
    StorageShapeNormalized,
}


#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SlideAutoRepairV2Proof {
    pub version: &'static str,
    pub enabled: bool,
    pub input_bytes: usize,
    pub output_bytes: usize,
    pub input_sha256: String,
    pub output_sha256: String,
    pub operations: Vec<SlideAutoRepairV2Operation>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub diagnostics: Vec<crate::presentation::schema::markdown::Diagnostic>,
}


#[derive(Debug, Clone)]
pub struct ProcessedSlideOutput {
    pub parsed: ParsedSlideDeck,
    pub proof: SlideAutoRepairV2Proof,
}
