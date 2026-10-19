//! Shared V2.1 output and bound-edit boundary; also used by the acceptance preview.
use super::*;
use crate::presentation::{edit, repair, schema::contract};
use sha2::{Digest, Sha256};

pub fn process(
    raw: &str,
    expectations: contract::SlideDeckExpectations,
    allowed_image_sources: &[String],
    enabled: bool,
) -> Result<repair::ProcessedSlideOutput, String> {
    let compiled = compile(raw, &[])?;
    for slide in compiled.value["deck"]["slides"].as_array().unwrap() {
        contract::validation::validate_slide(slide).map_err(|e| format!("{e:?}"))?;
    }
    // Compilation already applies the V2.1 contract. Legacy style stripping must
    // not discard explicit, supported alignment overrides from this value.
    let mut result = repair::process(&compiled.value.to_string(), expectations, allowed_image_sources, false)?;
    result.proof.enabled = enabled;
    result.proof.input_bytes = raw.len();
    result.proof.input_sha256 = format!("{:x}", Sha256::digest(raw.as_bytes()));
    result.proof.operations.insert(0, repair::SlideAutoRepairV2Operation::MarkdownCompiled);
    result.proof.diagnostics = compiled.diagnostics;
    Ok(result)
}

pub fn prepare_edit(before: &edit::Snapshot, args: Value) -> Result<Value, doe_core::diagnostic::compatibility::Failure> {
    let raw = args.as_object().filter(|o| o.len() == 1)
        .and_then(|o| o.get("markdown")).and_then(Value::as_str)
        .ok_or_else(|| crate::presentation::schema::safety::diagnostic("invalid_edit: supply markdown alone", "/arguments"))?;
    let slide = compile_bound_slide(raw, &before.slide)
        .map_err(|e| crate::presentation::schema::safety::diagnostic(&e, "/markdown"))?;
    edit::validation::prepare_candidate(before, json!({"slide":slide}))
}
