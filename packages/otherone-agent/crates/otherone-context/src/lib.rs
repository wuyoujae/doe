// 作用：otherone-context 模块 — 上下文管理（会话加载 + 压缩触发）
// 关联：被 otherone-agent 的 invoke_agent 调用
// 预期结果：提供 combine_context 核心方法

pub mod compact;
pub mod error;
pub mod types;

use tracing::warn;

use crate::compact::check_threshold::check_threshold;
use crate::compact::estimate_tokens::estimate_tokens;
use crate::error::ContextError;
use crate::types::{CombineContextOptions, ContextLoadType, PreCompactionMessageHook};
use otherone_ai::types::{Message, MessageContent};
use otherone_storage::types::SessionData;

/// 提取 MessageContent 中的文本
fn message_content_text(content: &MessageContent) -> &str {
    match content {
        MessageContent::Text(t) => t.as_str(),
        _ => "[非文本内容]",
    }
}

/// 组合 context 配置
/// 作用：根据 session_id 和 load_type 加载历史消息，检查 token 阈值并触发压缩
/// 关联：被 agent loop 调用
/// 预期结果：返回 messages 数组（包含 system prompt），供 AI 调用使用
pub async fn combine_context(
    options: &CombineContextOptions,
) -> Result<Vec<Message>, ContextError> {
    combine_context_with_pre_compaction_hook(options, None).await
}

pub async fn combine_context_with_pre_compaction_hook(
    options: &CombineContextOptions,
    pre_compaction_hook: Option<&PreCompactionMessageHook>,
) -> Result<Vec<Message>, ContextError> {
    // 参数有效性检查
    if options.session_id.is_empty() {
        return Err(ContextError::ConfigError(
            "session_id is required".to_string(),
        ));
    }
    if options.context_window == 0 {
        return Err(ContextError::ConfigError(
            "context_window is required".to_string(),
        ));
    }

    // 根据 load_type 加载数据
    let session_data = if let Some(store) = options.runtime_context.as_ref().and_then(|context| context.session_store.as_ref()) {
        store.read(options.session_id.clone()).await.map_err(ContextError::StorageError)?
    } else { match options.load_type {
        ContextLoadType::Database => {
            let db_config = options.database_config.as_ref().ok_or_else(|| {
                ContextError::ConfigError(
                    "database_config is required when load_type is database".to_string(),
                )
            })?;
            let runtime_context = options.runtime_context.as_ref().ok_or_else(|| {
                ContextError::ConfigError(
                    "runtime_context is required when load_type is database".to_string(),
                )
            })?;
            otherone_storage::database::reader::read_session_data_from_database_with_context(
                &options.session_id,
                db_config,
                runtime_context,
            )
            .await
            .map_err(|e| ContextError::StorageError(e.to_string()))?
        }
        ContextLoadType::LocalFile => {
            otherone_storage::localfile::reader::read_session_data(&options.session_id)
                .map_err(|e| ContextError::StorageError(e.to_string()))?
        }
    }
    };

    // 处理压缩记录，找到最新的压缩内容和起始 entry_id
    let (compacted_summary, start_entry_id) = process_compacted_entries(&session_data);

    // 根据 start_entry_id 过滤 entries
    let filtered_entries = filter_entries_from_start(&session_data.entries, &start_entry_id);

    // 更新 session_data 的 entries 为过滤后的结果
    let mut filtered_session = session_data;
    filtered_session.entries = filtered_entries;

    // 根据 provider 类型转换数据格式
    let messages = transform_to_messages(
        &filtered_session,
        &options.provider,
        compacted_summary.as_deref(),
    );

    // 计算 token 用量并检查是否需要压缩
    let mut context_tokens: u32 = 0;

    // 获取最后一条 assistant 消息的 token_consumption
    let assistant_entries: Vec<&otherone_storage::types::Entry> = filtered_session
        .entries
        .iter()
        .rev()
        .filter(|e| e.role == "assistant")
        .collect();

    // 最多检查 3 条 assistant 消息
    let max_attempts = std::cmp::min(3, assistant_entries.len());
    let mut found_token_index: Option<usize> = None;

    for i in 0..max_attempts {
        let entry = assistant_entries[i];
        if let Some(tc) = entry.token_consumption {
            context_tokens = tc;
            if let Some(pos) = filtered_session
                .entries
                .iter()
                .position(|e| e.entry_id == entry.entry_id)
            {
                found_token_index = Some(pos);
            }
            break;
        }
    }

    // 如果没有找到 token_consumption，或者找到后还有新消息，需要估算
    if context_tokens == 0
        || found_token_index.map_or(true, |idx| idx < filtered_session.entries.len() - 1)
    {
        let estimated = estimate_tokens(&messages);

        if context_tokens == 0 {
            let mut extra_tokens: u32 = 0;
            if let Some(ref sp) = options.system_prompt {
                let sys_msg = Message { reasoning_content: None,
                    role: "system".to_string(),
                    content: MessageContent::Text(sp.clone()),
                    name: None,
                    tool_calls: None,
                    tool_call_id: None,
                };
                extra_tokens += estimate_tokens(&[sys_msg]);
            }
            if let Some(ref tools) = options.tools {
                let tools_json = serde_json::to_string(tools).unwrap_or_default();
                let tools_msg = Message { reasoning_content: None,
                    role: "system".to_string(),
                    content: MessageContent::Text(tools_json),
                    name: None,
                    tool_calls: None,
                    tool_call_id: None,
                };
                extra_tokens += estimate_tokens(&[tools_msg]);
            }
            context_tokens = estimated + extra_tokens;
        } else {
            context_tokens += estimated;
        }
    }

    // 检查是否需要压缩
    let should_compress = check_threshold(
        context_tokens,
        options.context_window,
        options.threshold_percentage,
    );

    // 构建最终的 messages
    let mut final_messages = messages;

    if should_compress {
        let has_compacted = final_messages.first().map_or(false, |m| {
            m.role == "user"
                && (message_content_text(&m.content).contains("[压缩")
                    || message_content_text(&m.content).contains("[Compressed"))
        });

        warn!(
            "Context threshold exceeded ({} tokens / {} window). Triggering compaction.",
            context_tokens, options.context_window
        );

        // 实际执行压缩
        let storage_type = match options.load_type {
            ContextLoadType::Database => otherone_storage::types::StorageType::Database,
            ContextLoadType::LocalFile => otherone_storage::types::StorageType::LocalFile,
        };

        match crate::compact::compact_messages_with_executor(
            &final_messages,
            context_tokens,
            options.context_window,
            None,
            options.ai.as_ref(),
            has_compacted,
            Some(&options.session_id),
            Some(&storage_type),
            options.database_config.as_ref(),
            Some(&filtered_session.entries),
            options.runtime_context.as_ref(),
            pre_compaction_hook,
            options.compact_executor.as_deref(),
        )
        .await
        {
            Ok(compacted) => {
                final_messages = compacted;
            }
            Err(e) => {
                if options.compact_executor.is_some() { return Err(e); }
                warn!(
                    "Compaction failed: {}. Continuing with uncompacted messages.",
                    e
                );
            }
        }
    }

    // 在返回前添加 system prompt 到最前面
    if let Some(ref system_prompt) = options.system_prompt {
        final_messages.insert(
            0,
            Message { reasoning_content: None,
                role: "system".to_string(),
                content: MessageContent::Text(system_prompt.clone()),
                name: None,
                tool_calls: None,
                tool_call_id: None,
            },
        );
    }

    Ok(final_messages)
}

/// 处理压缩记录，找到最新的压缩内容和起始 entry_id
fn process_compacted_entries(session_data: &SessionData) -> (Option<String>, Option<String>) {
    if session_data.compacted_entries.is_empty() {
        return (None, None);
    }

    let mut sorted: Vec<&otherone_storage::types::CompactedEntry> =
        session_data.compacted_entries.iter().collect();
    sorted.sort_by(|a, b| b.create_at.cmp(&a.create_at));

    let latest = sorted[0];

    if latest.summary.is_empty() {
        return (None, None);
    }

    let final_entry_id = find_final_trigger_entry_id(
        &latest.trigger_entry_id,
        &session_data.compacted_entries,
        &session_data.entries,
    );

    (Some(latest.summary.clone()), final_entry_id)
}

/// 递归查找最终的 trigger_entry_id
fn find_final_trigger_entry_id(
    trigger_id: &str,
    compacted_entries: &[otherone_storage::types::CompactedEntry],
    entries: &[otherone_storage::types::Entry],
) -> Option<String> {
    let max_depth = 10;
    let mut current_id = trigger_id.to_string();
    let mut visited_ids = std::collections::HashSet::new();

    for _ in 0..max_depth {
        if visited_ids.contains(&current_id) {
            warn!("检测到循环引用: {}", current_id);
            return None;
        }
        visited_ids.insert(current_id.clone());

        if entries.iter().any(|e| e.entry_id == current_id) {
            return Some(current_id);
        }

        if let Some(compacted) = compacted_entries.iter().find(|c| c.entry_id == current_id) {
            current_id = compacted.trigger_entry_id.clone();
        } else {
            warn!("trigger_entry_id 不存在: {}", current_id);
            return None;
        }
    }

    warn!("超过最大递归深度，最后的 ID: {}", current_id);
    None
}

/// 从 start_entry_id 开始过滤 entries
fn filter_entries_from_start(
    entries: &[otherone_storage::types::Entry],
    start_entry_id: &Option<String>,
) -> Vec<otherone_storage::types::Entry> {
    let start_id = match start_entry_id {
        Some(id) => id,
        None => return entries.to_vec(),
    };

    if let Some(start_index) = entries.iter().position(|e| e.entry_id == *start_id) {
        entries[start_index..].to_vec()
    } else {
        warn!("start_entry_id 不存在于 entries 中: {}", start_id);
        entries.to_vec()
    }
}

/// 将 session 数据转换为 AI 请求的 messages 格式
fn transform_to_messages(
    session_data: &SessionData,
    provider: &otherone_ai::types::ProviderType,
    compacted_summary: Option<&str>,
) -> Vec<Message> {
    match provider {
        otherone_ai::types::ProviderType::OpenAI
        | otherone_ai::types::ProviderType::OpenRouter
        | otherone_ai::types::ProviderType::Local
        | otherone_ai::types::ProviderType::Fetch => {
            transform_to_openai_format(session_data, compacted_summary)
        }
        otherone_ai::types::ProviderType::Anthropic => {
            transform_to_anthropic_format(session_data, compacted_summary)
        }
    }
}

/// 转换为 OpenAI 格式的 messages
fn transform_to_openai_format(
    session_data: &SessionData,
    compacted_summary: Option<&str>,
) -> Vec<Message> {
    let mut messages: Vec<Message> = Vec::new();

    if let Some(summary) = compacted_summary {
        messages.push(Message { reasoning_content: None,
            role: "user".to_string(),
            content: MessageContent::Text(summary.to_string()),
            name: None,
            tool_calls: None,
            tool_call_id: None,
        });
    }

    if session_data.entries.is_empty() {
        return messages;
    }

    for entry in &session_data.entries {
        let mut message = Message { reasoning_content: None,
            role: entry.role.clone(),
            content: entry_message_content(entry),
            name: None,
            tool_calls: None,
            tool_call_id: None,
        };

        message.name = entry.metadata.get("otherone_message_name").and_then(|value| value.as_str()).map(str::to_owned);
        message.reasoning_content = entry.metadata.get("otherone_reasoning_content").and_then(|v| v.as_str()).map(str::to_owned);
        if entry.role == "assistant" {
            if let Some(ref tools) = entry.tools {
                if let Some(tool_calls) = tools.get("tool_calls") {
                    if let Ok(parsed_tool_calls) = serde_json::from_value(tool_calls.clone()) {
                        message.tool_calls = Some(parsed_tool_calls);
                    }
                }
            }
        }

        if entry.role == "tool" {
            if let Some(ref tools) = entry.tools {
                message.tool_call_id = tools
                    .get("tool_call_id")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());
                message.name = tools
                    .get("function_name")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());
            }
        }

        messages.push(message);
    }

    messages
}

/// Restore structured content when present while preserving legacy text entries.
fn entry_message_content(entry: &otherone_storage::types::Entry) -> MessageContent {
    entry
        .metadata
        .get(otherone_storage::types::MESSAGE_CONTENT_METADATA_KEY)
        .and_then(|value| serde_json::from_value(value.clone()).ok())
        .unwrap_or_else(|| MessageContent::Text(entry.content.clone()))
}

/// 转换为 Anthropic 格式的 messages
fn transform_to_anthropic_format(
    session_data: &SessionData,
    compacted_summary: Option<&str>,
) -> Vec<Message> {
    transform_to_openai_format(session_data, compacted_summary)
}

#[cfg(test)]
mod tests {
    use super::*;
    use otherone_ai::types::ContentPart;
    use otherone_storage::types::{
        AttributeBag, Entry, SessionData, StorageType, WriteEntryOptions,
    };
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    static LOCALFILE_TEST_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());

    fn entry(content: &str, metadata: AttributeBag) -> Entry {
        Entry {
            partition_key: None,
            entry_id: "entry-1".to_string(),
            session_id: "session-1".to_string(),
            content: content.to_string(),
            role: "user".to_string(),
            token_consumption: None,
            status: 0,
            tools: None,
            create_at: "2026-07-12T00:00:00Z".to_string(),
            is_compaction: 1,
            attributes: AttributeBag::new(),
            metadata,
        }
    }

    #[test]
    fn restores_structured_message_content_from_reserved_metadata() {
        let expected = MessageContent::MultiPart(vec![
            ContentPart::text("inspect this"),
            ContentPart::image_url("otherone-media://image/1", None),
            ContentPart::input_audio("otherone-media://audio/1", "mp3"),
            ContentPart::video_url("otherone-media://video/1"),
        ]);
        let mut metadata = AttributeBag::new();
        metadata.insert(
            otherone_storage::types::MESSAGE_CONTENT_METADATA_KEY.to_string(),
            serde_json::to_value(&expected).unwrap(),
        );
        let session = SessionData {
            session: None,
            entries: vec![entry("4 attachments", metadata)],
            compacted_entries: Vec::new(),
        };

        let messages = transform_to_openai_format(&session, None);
        assert_eq!(messages[0].content, expected);
    }

    #[test]
    fn legacy_entry_without_structured_metadata_remains_text() {
        let session = SessionData {
            session: None,
            entries: vec![entry("legacy prompt", AttributeBag::new())],
            compacted_entries: Vec::new(),
        };

        let messages = transform_to_openai_format(&session, None);
        assert_eq!(
            messages[0].content,
            MessageContent::Text("legacy prompt".to_string())
        );
    }

    #[test]
    fn invalid_reserved_metadata_falls_back_to_display_content() {
        let mut metadata = AttributeBag::new();
        metadata.insert(
            otherone_storage::types::MESSAGE_CONTENT_METADATA_KEY.to_string(),
            serde_json::json!({ "invalid": true }),
        );
        let session = SessionData {
            session: None,
            entries: vec![entry("safe fallback", metadata)],
            compacted_entries: Vec::new(),
        };

        let messages = transform_to_openai_format(&session, None);
        assert_eq!(
            messages[0].content,
            MessageContent::Text("safe fallback".to_string())
        );
    }

    async fn capture_compaction_request_server() -> (String, tokio::task::JoinHandle<String>) {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind compaction test server");
        let address = listener.local_addr().expect("compaction server address");
        let task = tokio::spawn(async move {
            let (mut stream, _) = listener.accept().await.expect("accept compaction request");
            let mut request = Vec::new();
            let header_end = loop {
                if let Some(index) = request.windows(4).position(|part| part == b"\r\n\r\n") {
                    break index + 4;
                }
                let mut buffer = [0_u8; 4096];
                let read = stream
                    .read(&mut buffer)
                    .await
                    .expect("read compaction request");
                assert!(read > 0, "request ended before headers");
                request.extend_from_slice(&buffer[..read]);
            };
            let headers = String::from_utf8_lossy(&request[..header_end]);
            let content_length = headers
                .lines()
                .filter_map(|line| line.split_once(':'))
                .find(|(name, _)| name.eq_ignore_ascii_case("content-length"))
                .and_then(|(_, value)| value.trim().parse::<usize>().ok())
                .expect("compaction request content length");
            while request.len() < header_end + content_length {
                let mut buffer = [0_u8; 4096];
                let read = stream
                    .read(&mut buffer)
                    .await
                    .expect("read compaction request body");
                assert!(read > 0, "request ended before body");
                request.extend_from_slice(&buffer[..read]);
            }
            let request_body =
                String::from_utf8(request[header_end..header_end + content_length].to_vec())
                    .expect("UTF-8 compaction request");
            let response_body = r#"{"choices":[{"index":0,"message":{"role":"assistant","content":"safe compacted summary"},"finish_reason":"stop"}]}"#;
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                response_body.len(),
                response_body
            );
            stream
                .write_all(response.as_bytes())
                .await
                .expect("write compaction response");
            request_body
        });
        (format!("http://{address}/v1"), task)
    }

    async fn write_local_entry(
        session_id: &str,
        role: &str,
        content: &str,
        tools: Option<serde_json::Value>,
    ) {
        otherone_storage::write_entry(&WriteEntryOptions {
            storage_type: StorageType::LocalFile,
            session_id: session_id.to_string(),
            role: role.to_string(),
            content: content.to_string(),
            tools,
            token_consumption: None,
            create_at: None,
            database_config: None,
            runtime_context: None,
            metadata: AttributeBag::new(),
        })
        .await
        .expect("write local context entry");
    }

    #[tokio::test]
    async fn threshold_compaction_filters_only_the_compacted_prefix_and_marks_summary() {
        let _guard = LOCALFILE_TEST_LOCK.lock().expect("localfile test lock");
        let root = std::env::temp_dir().join(format!(
            "otherone-context-pre-compaction-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("clock after epoch")
                .as_nanos()
        ));
        otherone_storage::localfile::set_storage_root(root);
        let session_id = otherone_storage::localfile::writer::create_new_session()
            .expect("create context session");
        let private_payload = format!(
            r#"{{"slideId":"slide-1","privateIr":"{}"}}"#,
            "base64-secret-".repeat(200)
        );
        write_local_entry(&session_id, "user", "old request", None).await;
        write_local_entry(&session_id, "assistant", "old answer", None).await;
        write_local_entry(
            &session_id,
            "tool",
            &private_payload,
            Some(serde_json::json!({
                "tool_call_id": "read-1",
                "function_name": "ReadSlideHtmlV2",
                "result": serde_json::from_str::<serde_json::Value>(&private_payload).unwrap()
            })),
        )
        .await;
        write_local_entry(&session_id, "user", "current request must remain", None).await;

        let (base_url, captured_request) = capture_compaction_request_server().await;
        let mut metadata = AttributeBag::new();
        metadata.insert(
            "history_filter".to_string(),
            serde_json::json!("test_receipt_v1"),
        );
        let hook = PreCompactionMessageHook::new(|mut messages| {
            for message in &mut messages {
                if message.role == "tool" && message.name.as_deref() == Some("ReadSlideHtmlV2") {
                    message.content =
                        MessageContent::Text(r#"{"status":"expired","slideId":"slide-1"}"#.into());
                }
            }
            Ok(messages)
        })
        .with_compacted_entry_metadata(metadata);
        let combined = combine_context_with_pre_compaction_hook(
            &CombineContextOptions {
                session_id: session_id.clone(),
                load_type: ContextLoadType::LocalFile,
                provider: otherone_ai::types::ProviderType::OpenAI,
                context_window: 100,
                threshold_percentage: Some(0.1),
                ai: Some(serde_json::json!({
                    "compact_llm_provider": "openai",
                    "compact_llm_apiKey": "test-key",
                    "compact_llm_baseUrl": base_url,
                    "compact_llm_model": "test-model"
            compact_executor: None,
                })),
                system_prompt: None,
                tools: None,
                database_config: None,
                runtime_context: None,
            },
            Some(&hook),
        )
        .await
        .expect("threshold compaction");

        let request_body = captured_request.await.expect("capture compaction request");
        assert!(request_body.contains(r#"\"status\":\"expired\""#));
        assert!(!request_body.contains("privateIr"));
        assert!(!request_body.contains("base64-secret"));
        assert_eq!(
            combined.last().map(|message| &message.content),
            Some(&MessageContent::Text(
                "current request must remain".to_string()
            ))
        );
        let session = otherone_storage::localfile::reader::read_session_data(&session_id)
            .expect("read compacted session");
        assert_eq!(session.compacted_entries.len(), 1);
        assert_eq!(
            session.compacted_entries[0].metadata.get("history_filter"),
            Some(&serde_json::json!("test_receipt_v1"))
        );
        otherone_storage::localfile::clear_storage_root();
    }
}
