// Origin: app/backend/core/src/slide_recovery/grounding.rs::collect_slide_business_value
use super::*;


pub(super) fn collect_slide_business_value(
    value: &Value,
    key: Option<&str>,
    component_type: Option<&str>,
    output: &mut GuardedFacts,
) {
    match value {
        Value::Object(object) => {
            add_series_data_unit_aliases(object, output);
            add_value_unit_alias(object, output);
            for (child_key, item) in object {
                if is_slide_business_key(child_key) {
                    collect_slide_business_value(item, Some(child_key), component_type, output);
                }
            }
        }
        Value::Array(items) => {
            for item in items {
                collect_slide_business_value(item, key, component_type, output);
            }
        }
        Value::String(value) => insert_string_fact(value, key, component_type, output),
        Value::Number(value) => insert_number_fact(&value.to_string(), output),
        Value::Null | Value::Bool(_) => {}
    }
}
