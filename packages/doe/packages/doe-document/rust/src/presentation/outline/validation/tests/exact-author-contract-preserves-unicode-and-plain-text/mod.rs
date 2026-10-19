// Origin: app/backend/core/src/plugin_outline_validation/tests.rs::exact_author_contract_preserves_unicode_and_plain_text
use super::*;


#[test]
pub(super) fn exact_author_contract_preserves_unicode_and_plain_text() {
    let v = sample();
    assert!(errors(&v).finish().is_ok());
    assert_eq!(parse(v.to_string().as_bytes()).unwrap(), v);
    let input: crate::presentation::outline::input::OutlineInput = serde_json::from_value(v).unwrap();
    assert_eq!(input.body[0].page, Some(1));
}
