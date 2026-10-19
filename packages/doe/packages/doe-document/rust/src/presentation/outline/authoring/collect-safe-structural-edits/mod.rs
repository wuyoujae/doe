// Origin: app/backend/core/src/outline_agent_output_contract.rs::collect_safe_structural_edits
use super::*;


pub(super) fn collect_safe_structural_edits(
    before: &Value,
    after: &Value,
    path: &str,
    edits: &mut Vec<RepairEdit>,
) -> Result<(), String> {
    if before == after {
        return Ok(());
    }
    match (before, after) {
        (Value::Object(before), Value::Object(after)) => {
            for (key, before_value) in before {
                let child_path = json_pointer_child(path, key);
                let Some(after_value) = after.get(key) else {
                    let constraint = if quarantinable_transport_field(path, key) {
                        "outline.transport_field.quarantine"
                    } else if key == "body"
                        && before_value.is_null()
                        && is_unambiguous_missing_generated_image_type(before)
                        && after.get("type").and_then(Value::as_str) == Some("generated_image")
                    {
                        "outline.image.missing_type_adapter"
                    } else {
                        return Err(unsafe_semantic_repair(&child_path));
                    };
                    edits.push(semantic_edit(
                        "remove_structural_field",
                        &child_path,
                        before_value,
                        &Value::Null,
                        constraint,
                    ));
                    continue;
                };
                if key == "type"
                    && before_value.as_str() == Some("image")
                    && after_value.as_str() == Some("generated_image")
                    && before
                        .get("src")
                        .and_then(Value::as_str)
                        .is_some_and(|src| src.starts_with("GENRATEIMG("))
                {
                    edits.push(semantic_edit(
                        "derive_discriminator",
                        &child_path,
                        before_value,
                        after_value,
                        "outline.image.reference_kind",
                    ));
                    continue;
                }
                if key == "page_number" && derived_page_number_is_valid(&child_path, after_value) {
                    edits.push(semantic_edit(
                        "derive_sequence_value",
                        &child_path,
                        before_value,
                        after_value,
                        "outline.slides.sequence",
                    ));
                    continue;
                }
                collect_safe_structural_edits(before_value, after_value, &child_path, edits)?;
            }
            for (key, after_value) in after {
                if before.contains_key(key) {
                    continue;
                }
                let child_path = json_pointer_child(path, key);
                let constraint = if key == "page_number"
                    && derived_page_number_is_valid(&child_path, after_value)
                {
                    "outline.slides.sequence"
                } else if key == "type"
                    && after_value.as_str() == Some("generated_image")
                    && is_unambiguous_missing_generated_image_type(before)
                {
                    "outline.image.missing_type_adapter"
                } else {
                    return Err(unsafe_semantic_repair(&child_path));
                };
                edits.push(semantic_edit(
                    "derive_structural_field",
                    &child_path,
                    &Value::Null,
                    after_value,
                    constraint,
                ));
            }
            Ok(())
        }
        (Value::Array(before), Value::Array(after)) if path.ends_with("/paragraphs") => {
            let filtered = before
                .iter()
                .filter(|value| !value.as_str().is_some_and(|text| text.trim().is_empty()))
                .cloned()
                .collect::<Vec<_>>();
            if filtered != *after {
                return Err(unsafe_semantic_repair(path));
            }
            edits.push(semantic_edit(
                "remove_empty_structural_item",
                path,
                &Value::Array(before.clone()),
                &Value::Array(after.clone()),
                "outline.text_block.non_empty_paragraphs",
            ));
            Ok(())
        }
        (Value::Array(before), Value::Array(after)) if before.len() == after.len() => {
            for (index, (before, after)) in before.iter().zip(after).enumerate() {
                collect_safe_structural_edits(before, after, &format!("{path}/{index}"), edits)?;
            }
            Ok(())
        }
        _ if derived_page_number_is_valid(path, after) => {
            edits.push(semantic_edit(
                "derive_sequence_value",
                path,
                before,
                after,
                "outline.slides.sequence",
            ));
            Ok(())
        }
        _ => Err(unsafe_semantic_repair(path)),
    }
}
