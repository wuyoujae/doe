// Origin: app/backend/core/src/plugin_slide_validation.rs::positive
use super::*;


pub fn positive(v: &Value, path: &str, errors: &mut Failure) {
    if !v
        .as_i64()
        .is_some_and(|n| (1..=MAX_SAFE_INTEGER).contains(&n))
    {
        errors.issue(
            path,
            "positive_integer",
            "Expected a positive safe integer.",
            "Copy the current revision or page number from a fresh project/slide read.",
        );
    }
}
