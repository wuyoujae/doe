// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::replays_external_json_fence_without_repairing_duplicate_keys
use super::*;


#[test]
#[ignore = "requires YRKIE_SLIDE_AUTO_REPAIR_V2_REPLAY_PATH"]
pub(super) fn replays_external_json_fence_without_repairing_duplicate_keys() {
    let path = std::env::var("YRKIE_SLIDE_AUTO_REPAIR_V2_REPLAY_PATH")
        .expect("set the external replay fixture path");
    let raw = std::fs::read_to_string(path).expect("read external replay fixture");
    let body = match super::super::json_code_fence::strip_unique_json_code_fence(&raw).unwrap() {
        super::super::json_code_fence::JsonCodeFence::Removed(body) => body,
        super::super::json_code_fence::JsonCodeFence::NotPresent => {
            panic!("external replay fixture must contain one json fence")
        }
    };
    let value = serde_json::from_str::<serde_json::Value>(body)
        .expect("fenced body must be syntactically valid JSON");
    let slide_count = value["deck"]["slides"]
        .as_array()
        .expect("fenced body must contain Slides")
        .len();
    assert_eq!(slide_count, 10);
    let strict_error =
        super::super::strict_json::parse(body).expect_err("duplicate object keys must remain rejected");
    assert!(strict_error.contains("duplicate object key 'layout'"));
    let error = process(
        &raw,
        SlideDeckExpectations::new(slide_count).unwrap(),
        &[],
        true,
    )
    .expect_err("duplicate object keys must remain rejected after removing the fence");
    assert!(error.starts_with(crate::presentation::schema::contract::INVALID_JSON_ERROR));
}
