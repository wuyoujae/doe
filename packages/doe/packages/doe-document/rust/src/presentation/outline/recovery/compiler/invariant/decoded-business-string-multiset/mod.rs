// Origin: app/backend/core/src/outline_recovery/compiler/invariant.rs::decoded_business_string_multiset
use super::*;


pub fn decoded_business_string_multiset(source: &str) -> BTreeMap<String, usize> {
    let mut values = BTreeMap::new();
    collect_business_strings_tolerantly(source, 0, &mut values);
    values
}
