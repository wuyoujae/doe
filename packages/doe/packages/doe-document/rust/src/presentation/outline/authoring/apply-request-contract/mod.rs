// Origin: app/backend/core/src/outline_agent_output_contract.rs::apply_request_contract
use super::*;


pub fn apply_request_contract(
    other: &mut Option<Value>,
    openrouter: bool,
    configured_max_output_tokens: Option<u32>,
    reasoning_effort: &str,
) -> Result<(), String> {
    let value = other.get_or_insert_with(|| Value::Object(Map::new()));
    let object = value.as_object_mut().ok_or_else(|| {
        format!("{OUTPUT_CONTRACT_VIOLATION_ERROR}: model request extras must be an object")
    })?;

    object.remove("parallelToolCalls");
    object.remove("parallel_tool_calls");
    object.remove("max_tokens");
    object.remove("response_format");
    object.remove("responseFormat");
    object.remove("plugins");
    object.insert(
        "maxTokens".to_string(),
        Value::from(configured_max_output_tokens.unwrap_or(DEFAULT_MAX_OUTPUT_TOKENS)),
    );
    if openrouter {
        object.remove("reasoning_effort");
        object.remove("reasoningEffort");
        object.remove("include_reasoning");
        let reasoning_effort = match reasoning_effort.trim() {
            "low" | "medium" | "high" => reasoning_effort.trim(),
            _ => "low",
        };
        object.insert(
            "reasoning".to_string(),
            json!({"effort": reasoning_effort, "exclude": false}),
        );
        let mut provider = object
            .remove("provider")
            .and_then(|value| value.as_object().cloned())
            .unwrap_or_default();
        provider.remove("require_parameters");
        provider.insert("allow_fallbacks".to_string(), Value::Bool(true));
        let mut ignored = provider
            .remove("ignore")
            .and_then(|value| value.as_array().cloned())
            .unwrap_or_default();
        for blocked in ["open-inference", "parasail", "baidu"] {
            if !ignored
                .iter()
                .filter_map(Value::as_str)
                .any(|provider| provider.eq_ignore_ascii_case(blocked))
            {
                ignored.push(Value::String(blocked.to_string()));
            }
        }
        provider.insert("ignore".to_string(), Value::Array(ignored));
        provider.insert(
            "order".to_string(),
            json!([
                "DeepInfra",
                "Fireworks",
                "Together",
                "Cloudflare",
                "AkashML"
            ]),
        );
        object.insert("provider".to_string(), Value::Object(provider));
    }
    Ok(())
}
