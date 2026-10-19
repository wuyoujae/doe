// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::process_with_slide_count
use super::*;


pub(super) fn process_with_slide_count(
    raw: &str,
    expected_slide_count: usize,
    enabled: bool,
) -> Result<ProcessedSlideOutput, String> {
    process(
        raw,
        SlideDeckExpectations::new(expected_slide_count).unwrap(),
        &[],
        enabled,
    )
}
