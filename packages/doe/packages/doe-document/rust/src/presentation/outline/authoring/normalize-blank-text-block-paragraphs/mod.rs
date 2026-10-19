// Origin: app/backend/core/src/outline_agent_output_contract.rs::normalize_blank_text_block_paragraphs
use super::*;


pub(super) fn normalize_blank_text_block_paragraphs(value: &mut Value) -> usize {
    match value {
        Value::Object(object) => {
            let mut repairs = 0usize;
            if object.get("type").and_then(Value::as_str) == Some("text_block") {
                if let Some(Value::Array(paragraphs)) = object.get_mut("paragraphs") {
                    let original_len = paragraphs.len();
                    paragraphs.retain(|paragraph| {
                        !paragraph
                            .as_str()
                            .is_some_and(|text| text.trim().is_empty())
                    });
                    repairs = original_len.saturating_sub(paragraphs.len());
                }
            }
            object.values_mut().fold(repairs, |count, child| {
                count.saturating_add(normalize_blank_text_block_paragraphs(child))
            })
        }
        Value::Array(values) => values.iter_mut().fold(0usize, |count, child| {
            count.saturating_add(normalize_blank_text_block_paragraphs(child))
        }),
        _ => 0,
    }
}
