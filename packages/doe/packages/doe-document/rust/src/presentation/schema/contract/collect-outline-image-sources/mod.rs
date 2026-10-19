// Origin: app/backend/core/src/slide_agent_output_contract.rs::collect_outline_image_sources
use super::*;


pub fn collect_outline_image_sources(value: &Value) -> Vec<String> {
    fn collect(value: &Value, sources: &mut Vec<String>, seen: &mut HashSet<String>) {
        match value {
            Value::Array(items) => {
                for item in items {
                    collect(item, sources, seen);
                }
            }
            Value::Object(object) => {
                let is_image = matches!(
                    object.get("type").and_then(Value::as_str),
                    Some("image" | "generated_image")
                );
                if is_image {
                    if let Some(source) = object.get("src").and_then(Value::as_str) {
                        if is_authoritative_image_source(source) && seen.insert(source.to_string())
                        {
                            sources.push(source.to_string());
                        }
                    }
                }
                for item in object.values() {
                    collect(item, sources, seen);
                }
            }
            Value::String(reference) if is_canonical_stable_asset_reference(reference) => {
                if seen.insert(reference.clone()) {
                    sources.push(reference.clone());
                }
            }
            _ => {}
        }
    }

    let mut sources = Vec::new();
    let mut seen = HashSet::new();
    collect(value, &mut sources, &mut seen);
    sources
}
