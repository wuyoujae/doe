use std::fs;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use otherone_agent::types::{AiOptions, ContextLoadType, InputOptions, StorageType};
use otherone_memory::MemoryPoint;

fn openrouter_ai_options(api_key: &str, base_url: &str, model: &str, prompt: &str) -> AiOptions {
    AiOptions {
        provider: otherone_ai::types::ProviderType::OpenRouter,
        api_key: api_key.to_string(),
        base_url: base_url.to_string(),
        model: model.to_string(),
        user_prompt: Some(prompt.to_string()),
        user_message: None,
        system_prompt: Some(
            "你是 Otherone 测试助手。正常回复用户，同时按系统长期记忆规则记录可复用信息。"
                .to_string(),
        ),
        messages: None,
        context_length: Some(1_000_000),
        temperature: Some(0.2),
        top_p: None,
        tools: None,
        tool_registry: None,
        terminal_tools: Vec::new(),
        tools_realize: None,
        tool_choice: None,
        required_terminal_tool: None,
        user_input_tool: None,
        parallel_tool_calls: None,
        stream: None,
        other: None,
        message_resolver: None,
        raw_chunk_observer: None,
        model_executor: None,
        compact_executor: None,
    }
}

fn agent_input(session_id: &str) -> InputOptions {
    InputOptions {
        session_id: session_id.to_string(),
        context_load_type: ContextLoadType::LocalFile,
        storage_type: Some(StorageType::LocalFile),
        database_config: None,
        runtime_context: None,
        context_window: 1_000_000,
        threshold_percentage: None,
        max_iterations: Some(6),
        enable_long_term_memory: Some(true),
        long_term_memory_recall_max_types: Some(5),
    }
}

async fn wait_for_memory_len_at_least(target_len: usize) -> otherone_memory::MemoryTree {
    for _ in 0..45 {
        let tree = otherone_memory::read_memory_tree().expect("read memory tree");
        if tree.memory_len() >= target_len {
            return tree;
        }

        tokio::time::sleep(Duration::from_secs(1)).await;
    }

    otherone_memory::read_memory_tree().expect("read memory tree after timeout")
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ExpectedMemoryBehavior {
    Store,
    DoNotStore,
}

#[derive(Debug, Clone)]
struct BatchMemoryCase {
    label: &'static str,
    prompt: &'static str,
    expected: ExpectedMemoryBehavior,
}

#[derive(Debug, Clone)]
struct BatchCaseResult {
    index: usize,
    label: &'static str,
    expected: ExpectedMemoryBehavior,
    tool_delta: usize,
    memory_changed: bool,
    memory_len: usize,
    response: String,
}

fn batch_memory_cases() -> Vec<BatchMemoryCase> {
    vec![
        BatchMemoryCase {
            label: "stable identity",
            prompt: "我叫林澈，这是可以长期记住的称呼。请简短回应。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "one-off calculation",
            prompt: "帮我算一下 17 * 23，只需要给答案。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
        BatchMemoryCase {
            label: "frontend style preference",
            prompt: "做前端界面时，我长期偏好紧凑、信息密度高、不要营销感太强的设计。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "temporary button request",
            prompt: "这次当前页面的按钮先临时改成红色，这不是我的长期偏好。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
        BatchMemoryCase {
            label: "food noodle preference",
            prompt: "我平时比较喜欢吃炸酱面，这个可以作为长期饮食偏好。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "food dish preference",
            prompt: "我也很喜欢吃糖醋排骨，也可以长期记住。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "food dislike",
            prompt: "我不喜欢香菜，这个饮食偏好以后可以参考。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "temporary lunch",
            prompt: "今天午饭我临时想吃披萨，但这只是今天的想法。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
        BatchMemoryCase {
            label: "rust error handling rule",
            prompt: "在我的 Rust 项目里，错误类型优先用 thiserror，应用层再用 anyhow。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "casual filler",
            prompt: "哈哈这个挺有意思的，继续。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
        BatchMemoryCase {
            label: "language preference",
            prompt: "以后和我交流默认用中文，除非我明确要求英文。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "battery temporary state",
            prompt: "我现在电脑快没电了，这只是当前状态。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
        BatchMemoryCase {
            label: "travel preference",
            prompt: "旅行时我更喜欢安静的小众路线，不喜欢特别商业化的景点。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "weather temporary",
            prompt: "今天上海下雨了，这只是今天的信息。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
        BatchMemoryCase {
            label: "identity correction",
            prompt: "以后叫我 Jae，不要再叫我林澈。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "verification code secret",
            prompt: "我的银行卡验证码是 123456，这个不要长期记住。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
        BatchMemoryCase {
            label: "diet constraint",
            prompt: "我长期不吃辣，点餐或推荐餐厅时可以参考。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "translation one-off",
            prompt: "把“今天项目进展顺利”翻译成英文。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
        BatchMemoryCase {
            label: "meeting prep habit",
            prompt: "我开会前喜欢先拿到简洁提纲，再看详细资料。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "fake code correction",
            prompt: "上一条我说的验证码是假的，不需要记任何验证码。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
        BatchMemoryCase {
            label: "running habit",
            prompt: "我周末通常会跑步，偏好 5 公里左右的轻量训练。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "coffee current fact",
            prompt: "我刚刚喝了一杯咖啡，这是当前闲聊。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
        BatchMemoryCase {
            label: "project memory architecture",
            prompt:
                "Otherone 的 memory 模块采用树结构长期记忆，不使用向量数据库作为长期记忆主存储。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "debug one-off",
            prompt: "解释一下 cargo test 输出里的 ignored 是什么意思。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
        BatchMemoryCase {
            label: "duplicate food preference",
            prompt: "再次提醒，我喜欢吃炸酱面。如果已经记住就不用新增重复节点。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
        BatchMemoryCase {
            label: "temporary language override",
            prompt: "这一轮临时用英文回答我，不要把它当成长期偏好。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
        BatchMemoryCase {
            label: "design color preference",
            prompt: "我偏好深色主题，但不要大面积紫色或紫蓝渐变。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "temporary random number",
            prompt: "临时记一下随机数 827361，十分钟后就没用了。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
        BatchMemoryCase {
            label: "allergy constraint",
            prompt: "我对花生过敏，涉及饮食建议时必须避开花生。",
            expected: ExpectedMemoryBehavior::Store,
        },
        BatchMemoryCase {
            label: "reminder task",
            prompt: "明天提醒我买纸巾，这是一个一次性提醒任务。",
            expected: ExpectedMemoryBehavior::DoNotStore,
        },
    ]
}

fn named_tool_call_count(session_id: &str, tool_name: &str) -> usize {
    otherone_storage::localfile::reader::read_session_data(session_id)
        .ok()
        .map(|session_data| {
            session_data
                .entries
                .iter()
                .filter_map(|entry| entry.tools.as_ref())
                .filter_map(|tools| tools.get("tool_calls"))
                .filter_map(|tool_calls| tool_calls.as_array())
                .flatten()
                .filter(|tool_call| {
                    tool_call
                        .get("function")
                        .and_then(|function| function.get("name"))
                        .and_then(|name| name.as_str())
                        == Some(tool_name)
                })
                .count()
        })
        .unwrap_or(0)
}

fn memory_tool_call_count(session_id: &str) -> usize {
    named_tool_call_count(session_id, "otherone_add_long_term_memory")
}

fn tool_result_contents(session_id: &str, function_name: &str) -> Vec<String> {
    otherone_storage::localfile::reader::read_session_data(session_id)
        .ok()
        .map(|session_data| {
            session_data
                .entries
                .iter()
                .filter(|entry| entry.role == "tool")
                .filter_map(|entry| {
                    let tools = entry.tools.as_ref()?;
                    let stored_function_name = tools
                        .get("function_name")
                        .and_then(|value| value.as_str())?;

                    if stored_function_name != function_name {
                        return None;
                    }

                    tools
                        .get("result")
                        .and_then(|value| value.as_str())
                        .map(ToString::to_string)
                        .or_else(|| Some(entry.content.clone()))
                })
                .collect()
        })
        .unwrap_or_default()
}

fn canonical_memory_snapshot() -> String {
    let mut points = otherone_memory::read_memory_tree()
        .expect("read memory tree")
        .to_points();
    points.sort_by(|left, right| left.point_id.cmp(&right.point_id));
    serde_json::to_string(&points).expect("serialize memory snapshot")
}

fn sorted_memory_points() -> Vec<MemoryPoint> {
    let mut points = otherone_memory::read_memory_tree()
        .expect("read memory tree")
        .to_points();
    points.sort_by(|left, right| left.point_id.cmp(&right.point_id));
    points
}

fn memory_file_modified() -> Option<SystemTime> {
    fs::metadata(otherone_memory::memory_storage_path())
        .ok()
        .and_then(|metadata| metadata.modified().ok())
}

async fn wait_for_memory_write_after(previous_modified: Option<SystemTime>) {
    for _ in 0..45 {
        let current_modified = memory_file_modified();
        if current_modified.is_some()
            && (previous_modified.is_none() || current_modified > previous_modified)
        {
            return;
        }

        tokio::time::sleep(Duration::from_secs(1)).await;
    }
}

async fn wait_for_memory_text_contains(needles: &[&str]) -> otherone_memory::MemoryTree {
    for _ in 0..60 {
        let tree = otherone_memory::read_memory_tree().expect("read memory tree");
        let stored_text = tree
            .to_points()
            .into_iter()
            .filter_map(|point| point.storage)
            .collect::<Vec<_>>()
            .join("\n");

        if needles.iter().all(|needle| stored_text.contains(needle)) {
            return tree;
        }

        tokio::time::sleep(Duration::from_secs(1)).await;
    }

    otherone_memory::read_memory_tree().expect("read memory tree after timeout")
}

#[tokio::test]
#[ignore = "live OpenRouter test; set OTHERONE_OPENROUTER_API_KEY to run"]
async fn live_openrouter_long_term_memory_write_flow() {
    let api_key = std::env::var("OTHERONE_OPENROUTER_API_KEY")
        .expect("OTHERONE_OPENROUTER_API_KEY is required");
    let base_url = std::env::var("OTHERONE_OPENROUTER_BASE_URL")
        .unwrap_or_else(|_| "https://openrouter.ai/api/v1".to_string());
    let main_model = std::env::var("OTHERONE_OPENROUTER_MAIN_MODEL")
        .unwrap_or_else(|_| "deepseek/deepseek-v4-flash".to_string());
    let auxiliary_model = std::env::var("OTHERONE_OPENROUTER_AUX_MODEL")
        .unwrap_or_else(|_| "deepseek/deepseek-v4-flash".to_string());

    let run_id = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let test_root = std::env::temp_dir().join(format!("otherone-live-memory-{run_id}"));
    otherone_storage::localfile::set_storage_root(test_root.clone());
    otherone_memory::set_memory_storage_root(test_root.clone());

    let session_id = format!("live-memory-{run_id}");
    let input = agent_input(&session_id);

    let mut first_ai = openrouter_ai_options(
        &api_key,
        &base_url,
        &main_model,
        "记住这个长期偏好：我平时比较喜欢吃炸酱面。请简短回应。",
    );
    let mut first_auxiliary_ai = openrouter_ai_options(&api_key, &base_url, &auxiliary_model, "");

    let first_response =
        otherone_agent::invoke_agent(&input, &mut first_ai, Some(&mut first_auxiliary_ai))
            .await
            .expect("first invoke_agent");
    println!("FIRST_RESPONSE:\n{}\n", first_response.content);

    let first_tree = wait_for_memory_len_at_least(1).await;
    println!(
        "MEMORY_AFTER_FIRST:\n{}\n",
        serde_json::to_string_pretty(&first_tree.to_points()).unwrap()
    );

    let mut second_ai = openrouter_ai_options(
        &api_key,
        &base_url,
        &main_model,
        "再记住一个长期偏好：我也很喜欢吃糖醋排骨。请简短回应。",
    );
    let mut second_auxiliary_ai = openrouter_ai_options(&api_key, &base_url, &auxiliary_model, "");

    let second_response =
        otherone_agent::invoke_agent(&input, &mut second_ai, Some(&mut second_auxiliary_ai))
            .await
            .expect("second invoke_agent");
    println!("SECOND_RESPONSE:\n{}\n", second_response.content);

    let final_tree = wait_for_memory_len_at_least(2).await;
    println!(
        "MEMORY_AFTER_SECOND:\n{}\n",
        serde_json::to_string_pretty(&final_tree.to_points()).unwrap()
    );

    assert!(
        final_tree.memory_len() >= 2,
        "expected at least two stored memory points"
    );

    otherone_memory::clear_memory_storage_root();
    otherone_storage::localfile::clear_storage_root();
}

#[tokio::test]
#[ignore = "live OpenRouter recall test; set OTHERONE_OPENROUTER_API_KEY to run"]
async fn live_openrouter_long_term_memory_recall_flow() {
    let api_key = std::env::var("OTHERONE_OPENROUTER_API_KEY")
        .expect("OTHERONE_OPENROUTER_API_KEY is required");
    let base_url = std::env::var("OTHERONE_OPENROUTER_BASE_URL")
        .unwrap_or_else(|_| "https://openrouter.ai/api/v1".to_string());
    let main_model = std::env::var("OTHERONE_OPENROUTER_MAIN_MODEL")
        .unwrap_or_else(|_| "deepseek/deepseek-v4-flash".to_string());
    let auxiliary_model = std::env::var("OTHERONE_OPENROUTER_AUX_MODEL")
        .unwrap_or_else(|_| "deepseek/deepseek-v4-flash".to_string());

    let run_id = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let test_root = std::env::temp_dir().join(format!("otherone-live-memory-recall-{run_id}"));
    otherone_storage::localfile::set_storage_root(test_root.clone());
    otherone_memory::set_memory_storage_root(test_root.clone());

    let session_id = format!("live-memory-recall-{run_id}");
    let input = agent_input(&session_id);
    let seed_prompts = [
        (
            "请长期记住：我喜欢吃炸酱面，这是稳定饮食偏好。只回复好的。",
            "炸酱面",
        ),
        (
            "请长期记住：我不喜欢香菜，这是稳定饮食偏好。只回复好的。",
            "香菜",
        ),
        (
            "请长期记住：我对花生过敏，饮食建议必须避开花生。只回复好的。",
            "花生",
        ),
    ];

    println!(
        "RECALL_TEST_ROOT={}",
        test_root.to_string_lossy().replace('\\', "/")
    );
    println!("MAIN_MODEL={main_model}");
    println!("AUXILIARY_MODEL={auxiliary_model}");

    for (index, (prompt, expected_memory_text)) in seed_prompts.iter().enumerate() {
        let before_tool_count = memory_tool_call_count(&session_id);
        let mut main_ai = openrouter_ai_options(&api_key, &base_url, &main_model, prompt);
        let mut auxiliary_ai = openrouter_ai_options(&api_key, &base_url, &auxiliary_model, "");

        let response = otherone_agent::invoke_agent(&input, &mut main_ai, Some(&mut auxiliary_ai))
            .await
            .unwrap_or_else(|error| panic!("seed {} invoke_agent failed: {error}", index + 1));
        wait_for_memory_text_contains(&[*expected_memory_text]).await;

        let after_tool_count = memory_tool_call_count(&session_id);
        println!(
            "SEED_{} add_tool_delta={} response={}",
            index + 1,
            after_tool_count.saturating_sub(before_tool_count),
            response.content.replace('\n', " ")
        );
    }

    let tree_after_seed = otherone_memory::read_memory_tree().expect("read memory tree");
    let stored_text = tree_after_seed
        .to_points()
        .into_iter()
        .filter_map(|point| point.storage)
        .collect::<Vec<_>>()
        .join("\n");
    println!("MEMORY_AFTER_SEED:\n{stored_text}");

    assert!(
        stored_text.contains("炸酱面"),
        "seed memory should include 炸酱面"
    );
    assert!(
        stored_text.contains("香菜"),
        "seed memory should include 香菜"
    );
    assert!(
        stored_text.contains("花生"),
        "seed memory should include 花生"
    );

    let before_recall_count =
        named_tool_call_count(&session_id, "otherone_recall_long_term_memory");
    let mut main_ai = openrouter_ai_options(
        &api_key,
        &base_url,
        &main_model,
        "我今晚想点外卖。请给我推荐一点吃的。",
    );
    let mut auxiliary_ai = openrouter_ai_options(&api_key, &base_url, &auxiliary_model, "");

    let recall_response =
        otherone_agent::invoke_agent(&input, &mut main_ai, Some(&mut auxiliary_ai))
            .await
            .expect("recall invoke_agent");
    let after_recall_count = named_tool_call_count(&session_id, "otherone_recall_long_term_memory");
    let recall_results =
        tool_result_contents(&session_id, "otherone_recall_long_term_memory").join("\n");

    println!(
        "RECALL_TOOL_CALLED={}",
        after_recall_count.saturating_sub(before_recall_count)
    );
    println!("RECALL_TOOL_RESULT:\n{recall_results}");
    println!("RECALL_RESPONSE:\n{}", recall_response.content);

    assert!(
        after_recall_count > before_recall_count,
        "main agent should actively call recall tool"
    );
    assert!(
        recall_results.contains("<long-term-memory>"),
        "recall tool should return memory wrapper"
    );
    assert!(
        recall_results.contains("炸酱面")
            && recall_results.contains("香菜")
            && recall_results.contains("花生"),
        "recall result should include the matched food preference subtree"
    );
    assert!(
        !recall_results.contains("\"storage\"") && !recall_results.contains("\"types\""),
        "recall result should expose storage facts only, not node JSON"
    );
    assert!(
        recall_response.content.contains("花生") && recall_response.content.contains("香菜"),
        "final answer should use recalled constraints"
    );

    otherone_memory::clear_memory_storage_root();
    otherone_storage::localfile::clear_storage_root();
}

#[tokio::test]
#[ignore = "30-round live OpenRouter memory test; set OTHERONE_OPENROUTER_API_KEY to run"]
async fn live_openrouter_long_term_memory_batch_30_rounds() {
    let api_key = std::env::var("OTHERONE_OPENROUTER_API_KEY")
        .expect("OTHERONE_OPENROUTER_API_KEY is required");
    let base_url = std::env::var("OTHERONE_OPENROUTER_BASE_URL")
        .unwrap_or_else(|_| "https://openrouter.ai/api/v1".to_string());
    let main_model = std::env::var("OTHERONE_OPENROUTER_MAIN_MODEL")
        .unwrap_or_else(|_| "deepseek/deepseek-v4-flash".to_string());
    let auxiliary_model = std::env::var("OTHERONE_OPENROUTER_AUX_MODEL")
        .unwrap_or_else(|_| "deepseek/deepseek-v4-flash".to_string());

    let run_id = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let test_root = std::env::temp_dir().join(format!("otherone-live-memory-batch-{run_id}"));
    otherone_storage::localfile::set_storage_root(test_root.clone());
    otherone_memory::set_memory_storage_root(test_root.clone());

    let session_id = format!("live-memory-batch-{run_id}");
    let input = agent_input(&session_id);
    let cases = batch_memory_cases();
    let mut results = Vec::new();

    println!(
        "BATCH_TEST_ROOT={}",
        test_root.to_string_lossy().replace('\\', "/")
    );
    println!("MAIN_MODEL={main_model}");
    println!("AUXILIARY_MODEL={auxiliary_model}");

    for (index, case) in cases.iter().enumerate() {
        let before_tool_count = memory_tool_call_count(&session_id);
        let before_snapshot = canonical_memory_snapshot();
        let before_modified = memory_file_modified();

        let mut main_ai = openrouter_ai_options(&api_key, &base_url, &main_model, case.prompt);
        let mut auxiliary_ai = openrouter_ai_options(&api_key, &base_url, &auxiliary_model, "");
        let response = otherone_agent::invoke_agent(&input, &mut main_ai, Some(&mut auxiliary_ai))
            .await
            .unwrap_or_else(|error| panic!("case {} invoke_agent failed: {error}", index + 1));

        let after_tool_count = memory_tool_call_count(&session_id);
        let tool_delta = after_tool_count.saturating_sub(before_tool_count);
        if tool_delta > 0 || case.expected == ExpectedMemoryBehavior::Store {
            wait_for_memory_write_after(before_modified).await;
        }

        let after_snapshot = canonical_memory_snapshot();
        let memory_changed = before_snapshot != after_snapshot;
        let memory_len = otherone_memory::read_memory_tree()
            .expect("read memory tree")
            .memory_len();
        let compact_response = response.content.replace('\n', " ");

        println!(
            "[{:02}] expected={:?} tool_delta={} memory_changed={} memory_len={} label={} response={}",
            index + 1,
            case.expected,
            tool_delta,
            memory_changed,
            memory_len,
            case.label,
            compact_response.chars().take(120).collect::<String>()
        );

        results.push(BatchCaseResult {
            index: index + 1,
            label: case.label,
            expected: case.expected,
            tool_delta,
            memory_changed,
            memory_len,
            response: compact_response,
        });
    }

    let false_positive_storage: Vec<_> = results
        .iter()
        .filter(|result| {
            result.expected == ExpectedMemoryBehavior::DoNotStore && result.memory_changed
        })
        .collect();
    let false_negative_storage: Vec<_> = results
        .iter()
        .filter(|result| result.expected == ExpectedMemoryBehavior::Store && !result.memory_changed)
        .collect();
    let queued_but_ignored: Vec<_> = results
        .iter()
        .filter(|result| {
            result.expected == ExpectedMemoryBehavior::DoNotStore
                && result.tool_delta > 0
                && !result.memory_changed
        })
        .collect();
    let max_memory_len = results
        .iter()
        .map(|result| result.memory_len)
        .max()
        .unwrap_or(0);

    println!(
        "SUMMARY total={} stored_false_positive={} stored_false_negative={} queued_but_ignored={} max_memory_len={} final_memory_len={}",
        results.len(),
        false_positive_storage.len(),
        false_negative_storage.len(),
        queued_but_ignored.len(),
        max_memory_len,
        otherone_memory::read_memory_tree()
            .expect("read memory tree")
            .memory_len()
    );

    if !false_positive_storage.is_empty() {
        println!("FALSE_POSITIVE_STORAGE:");
        for result in &false_positive_storage {
            println!(
                "- [{:02}] {} response={}",
                result.index, result.label, result.response
            );
        }
    }

    if !false_negative_storage.is_empty() {
        println!("FALSE_NEGATIVE_STORAGE:");
        for result in &false_negative_storage {
            println!(
                "- [{:02}] {} tool_delta={} response={}",
                result.index, result.label, result.tool_delta, result.response
            );
        }
    }

    if !queued_but_ignored.is_empty() {
        println!("QUEUED_BUT_IGNORED:");
        for result in &queued_but_ignored {
            println!("- [{:02}] {}", result.index, result.label);
        }
    }

    println!(
        "FINAL_MEMORY_TREE:\n{}",
        serde_json::to_string_pretty(&sorted_memory_points()).unwrap()
    );

    otherone_memory::clear_memory_storage_root();
    otherone_storage::localfile::clear_storage_root();
}
