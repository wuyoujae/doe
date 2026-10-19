// 作用：估算当前会话的 token 使用量
// 关联：被 combine_context 和 compact_messages 调用
// 预期结果：返回估算的 token 数量（基于中英文字符统计）

use otherone_ai::types::Message;

/// 估算 messages 数组的 token 数量
/// 作用：对给定 messages 进行 token 估算
/// 关联：被 combine_context 调用，当无法从 assistant 消息获取 token_consumption 时使用
/// 预期结果：返回估算的 token 总数量
pub fn estimate_tokens(messages: &[Message]) -> u32 {
    if messages.is_empty() {
        return 0;
    }

    let mut total_tokens: u32 = 0;

    for message in messages {
        match message.role.as_str() {
            "user" => total_tokens += estimate_user_message_tokens(message),
            "assistant" => total_tokens += estimate_assistant_message_tokens(message),
            "system" => total_tokens += estimate_system_message_tokens(message),
            "tool" => total_tokens += estimate_tool_message_tokens(message),
            "developer" => total_tokens += estimate_developer_message_tokens(message),
            _ => {
                // 未知角色，按普通文本处理
                if let otherone_ai::types::MessageContent::Text(ref content) = message.content {
                    total_tokens += estimate_content_tokens(content);
                }
            }
        }
    }

    total_tokens
}

/// 估算 user 消息的 token 数量
fn estimate_user_message_tokens(message: &Message) -> u32 {
    let mut tokens: u32 = 0;

    match &message.content {
        otherone_ai::types::MessageContent::Text(text) => {
            tokens += estimate_content_tokens(text);
        }
        otherone_ai::types::MessageContent::MultiPart(parts) => {
            for item in parts {
                if item.content_type == "text" {
                    if let Some(ref text) = item.text {
                        tokens += estimate_content_tokens(text);
                    }
                } else if item.content_type == "image_url" {
                    // 图片内容，按 5000 字符计算（≈1250 tokens）
                    tokens += (5000_f64 / 4.0).ceil() as u32;
                } else if item.content_type == "video_url" {
                    // 视频内容，按 5 分钟计算：300 秒 * 263 token/秒
                    tokens += 300 * 263;
                } else if item.content_type == "input_audio" {
                    // 音频内容，按 8 分钟计算：480 秒 * 32 token/秒
                    tokens += 480 * 32;
                }
            }
        }
    }

    tokens
}

/// 估算 assistant 消息的 token 数量
fn estimate_assistant_message_tokens(message: &Message) -> u32 {
    let mut tokens: u32 = 0;

    match &message.content {
        otherone_ai::types::MessageContent::Text(text) => {
            tokens += estimate_content_tokens(text);
        }
        otherone_ai::types::MessageContent::MultiPart(parts) => {
            for item in parts {
                if item.content_type == "text" {
                    if let Some(ref text) = item.text {
                        tokens += estimate_content_tokens(text);
                    }
                } else if item.content_type == "image_url" {
                    tokens += (5000_f64 / 4.0).ceil() as u32;
                } else if item.content_type == "audio" {
                    tokens += 480 * 32;
                }
            }
        }
    }

    // 计算 tool_calls 的 token
    if let Some(ref tool_calls) = message.tool_calls {
        for tool_call in tool_calls {
            tokens += estimate_content_tokens(&tool_call.function.name);
            tokens += estimate_content_tokens(&tool_call.function.arguments);
        }
    }

    tokens
}

/// 估算 system 消息的 token 数量
fn estimate_system_message_tokens(message: &Message) -> u32 {
    match &message.content {
        otherone_ai::types::MessageContent::Text(text) => estimate_content_tokens(text),
        _ => 0,
    }
}

/// 估算 tool 消息的 token 数量
fn estimate_tool_message_tokens(message: &Message) -> u32 {
    let mut tokens: u32 = 0;

    match &message.content {
        otherone_ai::types::MessageContent::Text(text) => {
            tokens += estimate_content_tokens(text);
        }
        otherone_ai::types::MessageContent::MultiPart(parts) => {
            for item in parts {
                if item.content_type == "text" {
                    if let Some(ref text) = item.text {
                        tokens += estimate_content_tokens(text);
                    }
                }
            }
        }
    }

    // 计算 name 字段的 token
    if let Some(ref name) = message.name {
        tokens += estimate_content_tokens(name);
    }

    tokens
}

/// 估算 developer 消息的 token 数量
fn estimate_developer_message_tokens(message: &Message) -> u32 {
    match &message.content {
        otherone_ai::types::MessageContent::Text(text) => estimate_content_tokens(text),
        _ => 0,
    }
}

/// 估算单个 content 字符串的 token 数量
/// 作用：基于字符统计估算 token 数
/// 关联：被各个消息类型估算函数调用
/// 预期结果：返回估算的 token 数（中文 ≈1.5 字符/token，英文 ≈4 字符/token）
fn estimate_content_tokens(content: &str) -> u32 {
    if content.is_empty() {
        return 0;
    }

    // 统计中文字符数（Unicode 范围：一-龥）
    let chinese_chars: usize = content
        .chars()
        .filter(|c| ('\u{4e00}'..='\u{9fa5}').contains(c))
        .count();

    let total_chars = content.chars().count();
    let english_chars = total_chars - chinese_chars;

    let chinese_tokens = (chinese_chars as f64 / 1.5).ceil() as u32;
    let english_tokens = (english_chars as f64 / 4.0).ceil() as u32;

    chinese_tokens + english_tokens
}

#[cfg(test)]
mod tests {
    use super::*;
    use otherone_ai::types::MessageContent;

    #[test]
    fn test_estimate_content_tokens_chinese() {
        // "你好" = 2 个中文字符 -> 2/1.5 = 2 tokens
        let tokens = estimate_content_tokens("你好");
        assert!(tokens > 0);
    }

    #[test]
    fn test_estimate_content_tokens_english() {
        // "hello" = 5 个英文字符 -> 5/4 = 2 tokens
        let tokens = estimate_content_tokens("hello");
        assert!(tokens > 0);
    }

    #[test]
    fn test_estimate_content_tokens_empty() {
        let tokens = estimate_content_tokens("");
        assert_eq!(tokens, 0);
    }

    #[test]
    fn test_estimate_tokens_empty_messages() {
        let tokens = estimate_tokens(&[]);
        assert_eq!(tokens, 0);
    }

    #[test]
    fn test_estimate_tokens_system_message() {
        // 注意：role 字段需要与 estimate_tokens 中的 match 匹配
        // "system" 角色会走 estimate_system_message_tokens
        let messages = vec![otherone_ai::types::Message { reasoning_content: None,
            role: "system".to_string(),
            content: MessageContent::Text("You are a helpful assistant.".to_string()),
            name: None,
            tool_calls: None,
            tool_call_id: None,
        }];
        let tokens = estimate_tokens(&messages);
        assert!(tokens > 0);
    }

    #[test]
    fn multipart_media_tokens_include_image_audio_and_video_budgets() {
        let message = otherone_ai::types::Message { reasoning_content: None,
            role: "user".to_string(),
            content: MessageContent::MultiPart(vec![
                otherone_ai::types::ContentPart::text("hello"),
                otherone_ai::types::ContentPart::image_url("internal:image", None),
                otherone_ai::types::ContentPart::input_audio("internal:audio", "wav"),
                otherone_ai::types::ContentPart::video_url("internal:video"),
            ]),
            name: None,
            tool_calls: None,
            tool_call_id: None,
        };

        let tokens = estimate_tokens(&[message]);
        assert!(tokens >= 1_250 + (480 * 32) + (300 * 263));
    }
}
