// Origin: app/backend/core/src/outline_agent_output_contract.rs::streamed_content_bytes
use super::*;


pub fn streamed_content_bytes(chunk: &Value) -> usize {
    chunk
        .get("choices")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|choice| {
            choice
                .get("delta")
                .and_then(|delta| delta.get("content"))
                .and_then(Value::as_str)
                .or_else(|| {
                    choice
                        .get("message")
                        .and_then(|message| message.get("content"))
                        .and_then(Value::as_str)
                })
        })
        .map(str::len)
        .sum()
}
