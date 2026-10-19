// Origin: app/backend/core/src/slide_recovery/tests.rs::all_invalid_pages_are_repaired_in_one_bounded_pass
use super::*;


#[test]
pub(super) fn all_invalid_pages_are_repaired_in_one_bounded_pass() {
    let mut first = valid_slide("slide-1", "First");
    first["theme"] = json!("consumer");
    let mut second = valid_slide("slide-2", "Second");
    second["editor"] = json!("yes");
    second["blocks"][0]["props"] = json!(r#"{"text":"Second"}"#);

    let outcome =
        recover_agent_deck(&deck(vec![first, second]).to_string(), expectations(2), &[]).unwrap();
    let repaired: Value = serde_json::from_str(&outcome.parsed.canonical_json).unwrap();

    assert!(repaired["deck"]["slides"][0].get("theme").is_none());
    assert!(repaired["deck"]["slides"][1]["blocks"][0]
        .get("editor")
        .is_none());
    assert_eq!(
        repaired["deck"]["slides"][1]["blocks"][0]["props"]["text"],
        "Second"
    );
}
