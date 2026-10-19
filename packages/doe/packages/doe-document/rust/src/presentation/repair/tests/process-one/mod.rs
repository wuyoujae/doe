// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::process_one
use super::*;


pub(super) fn process_one(raw: &str, enabled: bool) -> Result<ProcessedSlideOutput, String> {
    process_with_slide_count(raw, 1, enabled)
}
