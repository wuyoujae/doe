// Origin: app/backend/core/src/slide_recovery/mod.rs::collect_schema_diagnostics
use super::*;


pub(super) fn collect_schema_diagnostics(
    value: &Value,
    schema: &Value,
    path: &str,
    page_index: Option<usize>,
    diagnostics: &mut Vec<SlideDiagnostic>,
) {
    let resolved = resolve_schema_branch(schema, value);
    if resolved.get("anyOf").is_some() {
        push_schema_diagnostic(
            diagnostics,
            "schema.discriminator",
            path,
            "value does not uniquely match one contract branch",
            page_index,
            SlideRepairability::RequiresPageRepair,
        );
        return;
    }
    if !schema_type_matches(resolved, value) {
        let repairability = if value.is_string()
            && schema_expects_container(resolved)
            && value
                .as_str()
                .and_then(|raw| serde_json::from_str::<Value>(raw).ok())
                .is_some_and(|decoded| schema_type_matches(resolved, &decoded))
        {
            SlideRepairability::ContractUnique
        } else {
            SlideRepairability::RequiresPageRepair
        };
        push_schema_diagnostic(
            diagnostics,
            "schema.type",
            path,
            &format!(
                "expected {}, received {}",
                schema_type_label(resolved),
                value_type_label(value)
            ),
            page_index,
            repairability,
        );
        return;
    }
    if !schema_enum_matches(resolved, value) {
        let key = path.rsplit('.').next().unwrap_or(path);
        push_schema_diagnostic(
            diagnostics,
            "schema.enum",
            path,
            "value is outside the contract enum",
            page_index,
            if is_removable_control_field(key) {
                SlideRepairability::ContractUnique
            } else {
                SlideRepairability::RequiresPageRepair
            },
        );
    }

    if let Some(object) = value.as_object() {
        let properties = resolved.get("properties").and_then(Value::as_object);
        let required = resolved
            .get("required")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
            .collect::<HashSet<_>>();
        for key in &required {
            if !object.contains_key(*key) {
                let child_path = format!("{path}.{key}");
                push_schema_diagnostic(
                    diagnostics,
                    "schema.required",
                    &child_path,
                    "required field is missing",
                    page_index,
                    if is_deterministic_required_control(&child_path) {
                        SlideRepairability::ContractUnique
                    } else {
                        SlideRepairability::RequiresPageRepair
                    },
                );
            }
        }
        if resolved.get("additionalProperties") == Some(&Value::Bool(false)) {
            for key in object.keys() {
                if properties.is_none_or(|properties| !properties.contains_key(key)) {
                    let child_path = format!("{path}.{key}");
                    push_schema_diagnostic(
                        diagnostics,
                        "schema.unknown_field",
                        &child_path,
                        "field is not declared by the selected contract branch",
                        page_index,
                        if is_removable_control_field(key)
                            && object.get(key).is_some_and(is_empty_control_value)
                        {
                            SlideRepairability::ContractUnique
                        } else {
                            SlideRepairability::RequiresPageRepair
                        },
                    );
                }
            }
        }
        if let Some(properties) = properties {
            for (key, child) in object {
                let Some(child_schema) = properties.get(key) else {
                    continue;
                };
                let child_page_index = if path == "root.deck.slides" {
                    key.parse::<usize>().ok().or(page_index)
                } else {
                    page_index
                };
                collect_schema_diagnostics(
                    child,
                    child_schema,
                    &format!("{path}.{key}"),
                    child_page_index,
                    diagnostics,
                );
            }
        }
    } else if let Some(items) = value.as_array() {
        let min_items = resolved
            .get("minItems")
            .and_then(Value::as_u64)
            .unwrap_or(0) as usize;
        let max_items = resolved
            .get("maxItems")
            .and_then(Value::as_u64)
            .map_or(usize::MAX, |value| value as usize);
        if items.len() < min_items {
            push_schema_diagnostic(
                diagnostics,
                "schema.min_items",
                path,
                &format!("contains {} items; minimum is {min_items}", items.len()),
                page_index,
                SlideRepairability::RequiresPageRepair,
            );
        }
        if items.len() > max_items {
            push_schema_diagnostic(
                diagnostics,
                "schema.max_items",
                path,
                &format!("contains {} items; maximum is {max_items}", items.len()),
                page_index,
                SlideRepairability::RequiresPageRepair,
            );
        }
        if let Some(item_schema) = resolved.get("items") {
            for (index, item) in items.iter().enumerate() {
                let child_page_index = if path == "root.deck.slides" {
                    Some(index)
                } else {
                    page_index
                };
                collect_schema_diagnostics(
                    item,
                    item_schema,
                    &format!("{path}[{index}]"),
                    child_page_index,
                    diagnostics,
                );
            }
        }
    } else if let Some(text) = value.as_str() {
        let length = text.chars().count();
        let min_length = resolved
            .get("minLength")
            .and_then(Value::as_u64)
            .unwrap_or(0) as usize;
        let max_length = resolved
            .get("maxLength")
            .and_then(Value::as_u64)
            .map_or(usize::MAX, |value| value as usize);
        if length < min_length || length > max_length {
            push_schema_diagnostic(
                diagnostics,
                "schema.string_length",
                path,
                &format!("string length {length} is outside {min_length}..={max_length}"),
                page_index,
                SlideRepairability::RequiresPageRepair,
            );
        }
    }
}
