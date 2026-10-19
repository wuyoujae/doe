// 作用：解析各 AI 提供商的响应为统一格式
// 关联：被 invoke_agent 调用，提取 content、role、token_consumption、tools、thinking
// 预期结果：返回 provider 无关的统一 ParsedResponse

use otherone_ai::types::{ChatResponse, ParsedResponse, ToolCallsWrapper};

/// 解析 AI 模型的响应
/// 作用：根据 provider 类型解析不同格式的响应
/// 关联：被 invoke_agent 调用
/// 预期结果：返回统一格式的 ParsedResponse
pub fn parse_ai_response(
    response: &ChatResponse,
    provider: &otherone_ai::types::ProviderType,
) -> Result<ParsedResponse, String> {
    match provider {
        otherone_ai::types::ProviderType::OpenAI
        | otherone_ai::types::ProviderType::OpenRouter
        | otherone_ai::types::ProviderType::Local => parse_openai_response(response),
        otherone_ai::types::ProviderType::Fetch => parse_fetch_response(response),
        otherone_ai::types::ProviderType::Anthropic => parse_anthropic_response(response),
    }
}

/// 解析 OpenAI 的响应格式
fn parse_openai_response(response: &ChatResponse) -> Result<ParsedResponse, String> {
    if response.choices.is_empty() {
        return Err("Invalid OpenAI response format: missing choices".to_string());
    }

    let choice = &response.choices[0];
    let message = choice.message.as_ref().unwrap();
    let content = message.content.as_deref().unwrap_or("");
    let role = message.role.as_deref().unwrap_or("assistant");

    let token_consumption = response
        .usage
        .as_ref()
        .map(|u| u.total_tokens.unwrap_or(0))
        .unwrap_or(0);

    let tools = message.tool_calls.as_ref().map(|tc| ToolCallsWrapper {
        tool_calls: tc.clone(),
    });

    Ok(ParsedResponse {
        content: content.to_string(),
        role: role.to_string(),
        token_consumption,
        tools,
        thinking: None,
        raw_response: None,
    })
}

/// 解析 Anthropic 的响应格式
fn parse_anthropic_response(response: &ChatResponse) -> Result<ParsedResponse, String> {
    if response.choices.is_empty() {
        return Err("Invalid Anthropic response format: missing choices".to_string());
    }

    let choice = &response.choices[0];
    let message = choice.message.as_ref().unwrap();
    let content = message.content.as_deref().unwrap_or("");
    let role = message.role.as_deref().unwrap_or("assistant");

    let token_consumption = response
        .usage
        .as_ref()
        .map(|u| u.total_tokens.unwrap_or(0))
        .unwrap_or(0);

    Ok(ParsedResponse {
        content: content.to_string(),
        role: role.to_string(),
        token_consumption,
        tools: None,
        thinking: None,
        raw_response: None,
    })
}

/// 解析 Fetch 的响应格式
fn parse_fetch_response(response: &ChatResponse) -> Result<ParsedResponse, String> {
    // Fetch 响应预期与 OpenAI 格式兼容
    parse_openai_response(response)
}

#[cfg(test)]
mod tests {
    use super::*;
    use otherone_ai::types::{ChatResponse, Choice, ResponseMessage, Usage};

    #[test]
    fn test_parse_openai_response() {
        let response = ChatResponse {
            id: Some("chat-123".to_string()),
            object: Some("chat.completion".to_string()),
            created: Some(1234567890),
            model: Some("gpt-4".to_string()),
            choices: vec![Choice {
                index: 0,
                message: Some(ResponseMessage {
                    role: Some("assistant".to_string()),
                    content: Some("Hello!".to_string()),
                    reasoning_content: None,
                    reasoning: None,
                    thinking: None,
                    thought: None,
                    reasoning_details: None,
                    tool_calls: None,
                }),
                delta: None,
                finish_reason: Some("stop".to_string()),
            }],
            usage: Some(Usage {
                details: Default::default(),
                prompt_tokens: Some(10),
                completion_tokens: Some(5),
                total_tokens: Some(15),
                cost: None,
            }),
        };

        let parsed = parse_openai_response(&response).unwrap();
        assert_eq!(parsed.content, "Hello!");
        assert_eq!(parsed.role, "assistant");
        assert_eq!(parsed.token_consumption, 15);
        assert!(parsed.tools.is_none());
    }
}
