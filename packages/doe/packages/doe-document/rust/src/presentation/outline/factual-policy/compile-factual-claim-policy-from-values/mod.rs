// Origin: app/backend/core/src/outline_recovery/snapshot.rs::compile_factual_claim_policy_from_values
use super::*;


pub fn compile_factual_claim_policy_from_values(
    values: &[&serde_json::Value],
) -> &'static str {
    fn collect(value: &serde_json::Value, output: &mut Vec<String>) {
        match value {
            serde_json::Value::String(value) if !value.trim().is_empty() => {
                output.push(value.trim().to_string());
            }
            serde_json::Value::Array(items) => {
                for item in items {
                    collect(item, output);
                }
            }
            serde_json::Value::Object(object) => {
                for item in object.values() {
                    collect(item, output);
                }
            }
            _ => {}
        }
    }

    let mut text = Vec::new();
    for value in values {
        collect(value, &mut text);
    }
    compile_factual_claim_policy(&text.join("\n"))
}
