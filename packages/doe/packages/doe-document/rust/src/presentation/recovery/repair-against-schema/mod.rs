// Origin: app/backend/core/src/slide_recovery/mod.rs::repair_against_schema
use super::*;


pub(super) fn repair_against_schema(
    value: &mut Value,
    schema: &Value,
    path: &str,
    page_index: Option<usize>,
    edits: &mut Vec<SlideRepairEdit>,
) {
    let schema = resolve_schema_branch(schema, value);
    if value.is_string() && schema_expects_container(schema) {
        if let Some(decoded) = value
            .as_str()
            .and_then(|raw| serde_json::from_str::<Value>(raw).ok())
            .filter(|decoded| schema_type_matches(schema, decoded))
        {
            let before = value.clone();
            *value = decoded;
            record_edit(
                edits,
                "contract.stringified_container",
                path,
                "decode_exact_json_container",
                page_index,
                &before,
                value,
                "the field contract requires a container and the complete string uniquely decodes to that container type",
            );
        }
    }

    if let (Some(object), Some(properties)) = (
        value.as_object_mut(),
        schema.get("properties").and_then(Value::as_object),
    ) {
        let required = schema
            .get("required")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
            .collect::<HashSet<_>>();
        let keys = object.keys().cloned().collect::<Vec<_>>();
        for key in keys {
            let child_path = format!("{path}.{key}");
            let Some(property_schema) = properties.get(&key) else {
                if is_removable_control_field(&key) {
                    let before = object.remove(&key).expect("key was collected from object");
                    record_edit(
                        edits,
                        "contract.forbidden_control",
                        &child_path,
                        "remove_forbidden_control",
                        page_index,
                        &before,
                        &Value::Null,
                        "the field carries only runtime control data and is not part of the Agent authoring contract",
                    );
                }
                continue;
            };
            let remove_optional_control = !required.contains(key.as_str())
                && is_removable_control_field(&key)
                && (!schema_type_matches(property_schema, &object[&key])
                    || !schema_enum_matches(property_schema, &object[&key]));
            if remove_optional_control {
                let before = object.remove(&key).expect("key was collected from object");
                record_edit(
                    edits,
                    "contract.invalid_optional_control",
                    &child_path,
                    "remove_invalid_optional_control",
                    page_index,
                    &before,
                    &Value::Null,
                    "the field is optional, carries only renderer control data, and has no legal information-preserving substitution",
                );
                continue;
            }
            if let Some(child) = object.get_mut(&key) {
                repair_against_schema(child, property_schema, &child_path, page_index, edits);
            }
        }
    } else if let (Some(items), Some(item_schema)) = (value.as_array_mut(), schema.get("items")) {
        for (index, item) in items.iter_mut().enumerate() {
            repair_against_schema(
                item,
                item_schema,
                &format!("{path}[{index}]"),
                page_index,
                edits,
            );
        }
    }
}
