// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::disabled_v2_does_not_repair_a_missing_comma
use super::*;


#[test]
pub(super) fn disabled_v2_does_not_repair_a_missing_comma() {
    let raw =
        valid_deck(r#""plain""#).replace(r#""type":"text","props""#, r#""type":"text" "props""#);

    let error = process_one(&raw, false).unwrap_err();
    assert!(error.starts_with(crate::presentation::schema::contract::INVALID_JSON_ERROR));
}
