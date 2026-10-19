// Origin: app/backend/core/src/slide_auto_repair_v2/mod.rs::process
use super::*;


pub fn process(
    raw: &str,
    expectations: SlideDeckExpectations,
    allowed_image_sources: &[String],
    enabled: bool,
) -> Result<ProcessedSlideOutput, String> {
    use crate::presentation::schema::contract::{MAX_OUTPUT_BYTES, OUTPUT_TOO_LARGE_ERROR};
    if raw.len() > MAX_OUTPUT_BYTES {
        return Err(format!("{OUTPUT_TOO_LARGE_ERROR}: response exceeded {MAX_OUTPUT_BYTES} bytes"));
    }
    let mut operations = Vec::new();
    let mut candidate = raw;
    // Valid JSON is authoritative even if a text field resembles a final declaration.
    if enabled && serde_json::from_str::<Value>(raw).is_err() {
        if let Some(final_json) = final_response::select(raw)? {
            candidate = final_json;
            operations.push(SlideAutoRepairV2Operation::ExplicitFinalJsonSelected);
        }
    }
    if enabled {
        if let JsonCodeFence::Removed(body) = json_code_fence::strip_unique_json_code_fence(candidate)? {
            candidate = body;
            operations.push(SlideAutoRepairV2Operation::JsonCodeFenceRemoved);
        }
    }
    let strict = strict_deck::parse(candidate, expectations, allowed_image_sources, enabled)?;
    if strict.json_syntax_repaired {
        operations.push(SlideAutoRepairV2Operation::JsonSyntaxRepaired);
    }
    if strict.theme_managed_fields_removed {
        operations.push(SlideAutoRepairV2Operation::ThemeManagedFieldsRemoved);
    }
    if strict.component_content_shapes_normalized {
        operations.push(SlideAutoRepairV2Operation::ComponentContentShapeNormalized);
    }
    if strict.storage_shape_normalized {
        operations.push(SlideAutoRepairV2Operation::StorageShapeNormalized);
    }
    Ok(ProcessedSlideOutput {
        parsed: strict.parsed,
        proof: SlideAutoRepairV2Proof {
            version: SLIDE_AUTO_REPAIR_V2_VERSION,
            enabled,
            input_bytes: raw.len(),
            output_bytes: strict.output.len(),
            input_sha256: sha256_hex(raw.as_bytes()),
            output_sha256: sha256_hex(strict.output.as_bytes()),
            operations,
            diagnostics: Vec::new(),
        },
    })
}
