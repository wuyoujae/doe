// Origin: app/backend/core/src/slide_recovery/mod.rs::project_textual_collection_item
use super::*;


pub(super) fn project_textual_collection_item(value: &Value) -> Option<String> {
    let mut values = Vec::new();
    if let Some(object) = value.as_object() {
        const PREFERRED_KEYS: &[&str] = &[
            "number",
            "title",
            "label",
            "name",
            "text",
            "detail",
            "description",
            "value",
            "unit",
            "period",
        ];
        for key in PREFERRED_KEYS {
            if let Some(value) = object.get(*key) {
                collect_projectable_business_values(value, Some(key), &mut values);
            }
        }
        for (key, value) in object {
            if !PREFERRED_KEYS.contains(&key.as_str()) {
                collect_projectable_business_values(value, Some(key), &mut values);
            }
        }
    } else {
        collect_projectable_business_values(value, None, &mut values);
    }
    deduplicate_projection_values(&mut values);
    (!values.is_empty()).then(|| values.join(" · "))
}
