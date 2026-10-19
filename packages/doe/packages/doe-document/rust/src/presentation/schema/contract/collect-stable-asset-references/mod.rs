// Origin: app/backend/core/src/slide_agent_output_contract.rs::collect_stable_asset_references
use super::*;


pub fn collect_stable_asset_references(value: &Value) -> Vec<String> {
    fn collect(value: &Value, references: &mut Vec<String>, seen: &mut HashSet<String>) {
        match value {
            Value::String(value) if is_canonical_stable_asset_reference(value) => {
                if seen.insert(value.clone()) {
                    references.push(value.clone());
                }
            }
            Value::Array(items) => {
                for item in items {
                    collect(item, references, seen);
                }
            }
            Value::Object(object) => {
                for item in object.values() {
                    collect(item, references, seen);
                }
            }
            _ => {}
        }
    }

    let mut references = Vec::new();
    let mut seen = HashSet::new();
    collect(value, &mut references, &mut seen);
    references
}
