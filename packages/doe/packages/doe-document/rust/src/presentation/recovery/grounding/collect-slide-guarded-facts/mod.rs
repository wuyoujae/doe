// Origin: app/backend/core/src/slide_recovery/grounding.rs::collect_slide_guarded_facts
use super::*;


pub(super) fn collect_slide_guarded_facts(value: &Value, output: &mut GuardedFacts) {
    fn visit_node(value: &Value, output: &mut GuardedFacts) {
        let Some(object) = value.as_object() else {
            return;
        };
        let component_type = object.get("type").and_then(Value::as_str);
        if component_type == Some("layout-group") {
            if let Some(children) = object.get("children").and_then(Value::as_array) {
                for child in children {
                    visit_node(child, output);
                }
            }
            return;
        }
        if let Some(props) = object.get("props").and_then(Value::as_object) {
            add_value_unit_alias(props, output);
            for (key, item) in props {
                if is_slide_business_key(key) {
                    collect_slide_business_value(item, Some(key), component_type, output);
                }
            }
        }
    }

    let Some(object) = value.as_object() else {
        return;
    };
    for key in ["blocks", "components"] {
        if let Some(nodes) = object.get(key).and_then(Value::as_array) {
            for node in nodes {
                visit_node(node, output);
            }
        }
    }
}
