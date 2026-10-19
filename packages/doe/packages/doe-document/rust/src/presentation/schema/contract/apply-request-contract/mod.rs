// Origin: app/backend/core/src/slide_agent_output_contract.rs::apply_request_contract
use super::*;


pub fn apply_request_contract(
    other: &mut Option<Value>,
    openrouter: bool,
    configured_max_output_tokens: Option<u32>,
) -> Result<(), String> {
    let value = other.get_or_insert_with(|| Value::Object(Map::new()));
    let object = value.as_object_mut().ok_or_else(|| {
        format!("{OUTPUT_CONTRACT_VIOLATION_ERROR}: model request extras must be an object")
    })?;

    // Slide generation exposes no tools, so forwarding this option is both
    // meaningless and can exclude otherwise compatible OpenRouter endpoints.
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
        // A Slide Deck is itself a large structured completion. Keep visible
        // reasoning on a small, explicit budget so the Agent trace is useful
        // without allowing a model-level effort ratio to consume the Deck's
        // JSON completion budget.
        object.remove("reasoning_effort");
        object.remove("reasoningEffort");
        object.remove("include_reasoning");
        object.insert(
            "reasoning".to_string(),
            json!({"max_tokens": VISIBLE_REASONING_MAX_TOKENS, "exclude": false}),
        );
        let mut provider = object
            .remove("provider")
            .and_then(|value| value.as_object().cloned())
            .unwrap_or_default();
        provider.remove("require_parameters");
        let mut ignored = provider
            .remove("ignore")
            .and_then(|value| value.as_array().cloned())
            .unwrap_or_default();
        if !ignored
            .iter()
            .filter_map(Value::as_str)
            .any(|provider| provider.eq_ignore_ascii_case("parasail"))
        {
            ignored.push(Value::String("parasail".to_string()));
        }
        provider.insert("ignore".to_string(), Value::Array(ignored));
        object.insert("provider".to_string(), Value::Object(provider));
    }
    Ok(())
}
