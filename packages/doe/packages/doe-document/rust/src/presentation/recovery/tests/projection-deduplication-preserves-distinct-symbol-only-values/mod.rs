// Origin: app/backend/core/src/slide_recovery/tests.rs::projection_deduplication_preserves_distinct_symbol_only_values
use super::*;


#[test]
pub(super) fn projection_deduplication_preserves_distinct_symbol_only_values() {
    let mut values = vec!["%".to_string(), "$".to_string(), "%".to_string()];

    deduplicate_projection_values(&mut values);

    assert_eq!(values, vec!["%", "$"]);
}
