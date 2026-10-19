// Origin: app/backend/core/src/slide_recovery/mod.rs::normalize_legacy_stat_renderer_props
use super::*;


pub(super) fn normalize_legacy_stat_renderer_props(
    node: &mut Map<String, Value>,
    original_node_type: &str,
    path: &str,
    page_index: usize,
    edits: &mut Vec<SlideRepairEdit>,
) {
    if original_node_type != "stat" || node.get("type").and_then(Value::as_str) != Some("stat") {
        return;
    }
    let before = Value::Object(node.clone());
    let Some(props) = node.get_mut("props").and_then(Value::as_object_mut) else {
        return;
    };
    let mut changed = false;
    let mut legacy_title_description = None;
    if !props.contains_key("label") {
        if let Some(title) = props.remove("title") {
            props.insert("label".to_string(), title);
            changed = true;
        }
    } else if let Some(title) = props
        .get("title")
        .and_then(Value::as_str)
        .map(str::trim)
        .map(str::to_string)
    {
        props.remove("title");
        if !title.is_empty() {
            legacy_title_description = Some(title);
        }
        changed = true;
    }
    if let Some(unit) = props
        .get("unit")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
    {
        if let Some(value) = props.get("value").and_then(|value| match value {
            Value::String(value) => Some(value.trim().to_string()),
            Value::Number(value) => Some(value.to_string()),
            _ => None,
        }) {
            let display = if value.contains(&unit) {
                value
            } else {
                format!("{value}{unit}")
            };
            props.insert("value".to_string(), Value::String(display));
            props.remove("unit");
            changed = true;
        }
    }
    let mut descriptions = props
        .get("description")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(|value| vec![value.to_string()])
        .unwrap_or_default();
    if let Some(title) = legacy_title_description {
        descriptions.push(title);
    }
    for key in ["period", "comparison"] {
        if let Some(value) = props
            .get(key)
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_string)
        {
            descriptions.push(value);
            props.remove(key);
            changed = true;
        }
    }
    deduplicate_projection_values(&mut descriptions);
    if !descriptions.is_empty() {
        props.insert(
            "description".to_string(),
            Value::String(descriptions.join(" · ")),
        );
    }
    if !changed {
        return;
    }
    let after = Value::Object(node.clone());
    record_edit(
        edits,
        "renderer.legacy_stat_support_fields",
        &format!("{path}.props"),
        "merge_stat_unit_period_and_comparison_into_supported_visible_fields",
        Some(page_index),
        &before,
        &after,
        "legacy stat fields are merged into renderer-supported value and description fields without dropping their visible business content",
    );
}
