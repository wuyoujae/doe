// Origin: app/backend/core/src/plugin_outline_validation.rs::request_id
use super::*;


pub fn request_id(v: &Value, errors: &mut Failure) {
    static UUID: LazyLock<regex::Regex> = LazyLock::new(|| {
        regex::Regex::new(
            r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
        )
        .unwrap()
    });
    if !v.as_str().is_some_and(|s| UUID.is_match(s)) {
        errors.issue(
            "/requestId",
            "request_id",
            "Expected a lowercase UUID.",
            "Generate one UUID per intended operation and retain it for identical retries.",
        );
    }
}
