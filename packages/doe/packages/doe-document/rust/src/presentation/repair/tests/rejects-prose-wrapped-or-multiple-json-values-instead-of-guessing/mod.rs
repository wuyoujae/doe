// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::rejects_prose_wrapped_or_multiple_json_values_instead_of_guessing
use super::*;


#[test]
pub(super) fn rejects_prose_wrapped_or_multiple_json_values_instead_of_guessing() {
    let raw = valid_deck(r#""plain""#);
    for invalid in [format!("Here is the deck: {raw}"), format!("{raw}\n{raw}")] {
        assert!(
            process_one(&invalid, true)
                .unwrap_err()
                .starts_with(crate::presentation::schema::contract::INVALID_JSON_ERROR),
            "unexpectedly accepted: {invalid}"
        );
    }
}
