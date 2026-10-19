// Origin: app/backend/core/src/slide_recovery/grounding.rs::collect_outline_body_facts
use super::*;


pub(super) fn collect_outline_body_facts(value: &Value, key: Option<&str>, output: &mut GuardedFacts) {
    if key.is_some_and(is_outline_control_key) {
        return;
    }
    match value {
        Value::Object(object)
            if object
                .get("type")
                .and_then(Value::as_str)
                .is_some_and(|kind| kind.contains("image")) => {}
        Value::Object(object) => {
            add_dimension_value_aliases(object, output);
            add_value_unit_alias(object, output);
            for (child_key, item) in object {
                collect_outline_body_facts(item, Some(child_key), output);
            }
        }
        Value::Array(items) => {
            for item in items {
                collect_outline_body_facts(item, key, output);
            }
        }
        Value::String(value) => insert_string_fact(value, key, None, output),
        Value::Number(value) => insert_number_fact(&value.to_string(), output),
        Value::Null | Value::Bool(_) => {}
    }
}
