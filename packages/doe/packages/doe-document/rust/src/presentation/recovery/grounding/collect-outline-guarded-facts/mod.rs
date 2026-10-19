// Origin: app/backend/core/src/slide_recovery/grounding.rs::collect_outline_guarded_facts
use super::*;


pub(super) fn collect_outline_guarded_facts(value: &Value, output: &mut GuardedFacts) {
    fn visit(value: &Value, key: Option<&str>, output: &mut GuardedFacts) {
        if key == Some("body") {
            collect_outline_body_facts(value, None, output);
            return;
        }
        match value {
            Value::Array(items) => {
                for item in items {
                    visit(item, key, output);
                }
            }
            Value::Object(object) => {
                for (child_key, item) in object {
                    visit(item, Some(child_key), output);
                }
            }
            _ => {}
        }
    }
    visit(value, None, output);
}
