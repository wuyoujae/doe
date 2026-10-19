// Origin: app/backend/core/src/slide_auto_repair_v2/json_code_fence.rs::contains_nested_fence


pub(super) fn contains_nested_fence(body: &str) -> bool {
    body.lines().any(|line| line.trim().starts_with("```"))
}
