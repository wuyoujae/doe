// Origin: app/backend/core/src/outline_recovery/compiler/tests.rs::tolerant_business_fingerprint_recurses_into_stringified_json_and_skips_keys
use super::*;


#[test]
pub(super) fn tolerant_business_fingerprint_recurses_into_stringified_json_and_skips_keys() {
    let source = r#"{"contents_json":"{\"title\":{\"body\":\"Important fact\",\"describe\":\"Visual instruction\"}}"}"#;
    let values = decoded_business_string_multiset(source);
    assert_eq!(values.get("Important fact"), Some(&1));
    assert_eq!(values.get("Visual instruction"), Some(&1));
    assert!(!values.contains_key("contents_json"));
}
