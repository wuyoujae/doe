// Origin: app/backend/core/src/slide_recovery/grounding.rs::collect_delegation_guarded_facts
use super::*;


pub(super) fn collect_delegation_guarded_facts(value: &Value, output: &mut GuardedFacts) {
    fn visit(value: &Value, key: Option<&str>, output: &mut GuardedFacts) {
        match value {
            Value::Object(object) => {
                add_value_unit_alias(object, output);
                for (child_key, item) in object {
                    visit(item, Some(child_key), output);
                }
            }
            Value::Array(items) => {
                for item in items {
                    visit(item, key, output);
                }
            }
            Value::String(value) => insert_string_fact(value, key, None, output),
            Value::Number(value) => insert_number_fact(&value.to_string(), output),
            Value::Null | Value::Bool(_) => {}
        }
    }
    visit(value, None, output);
}
