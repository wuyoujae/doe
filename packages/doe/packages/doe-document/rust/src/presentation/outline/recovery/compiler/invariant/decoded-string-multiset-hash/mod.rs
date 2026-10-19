// Origin: app/backend/core/src/outline_recovery/compiler/invariant.rs::decoded_string_multiset_hash
use super::*;


pub(in super::super) fn decoded_string_multiset_hash(source: &str) -> String {
    let mut values = collect_decoded_strings_tolerantly(source);
    values.sort_unstable();
    let mut encoded = Vec::new();
    for value in values {
        encoded.extend_from_slice(&(value.len() as u64).to_be_bytes());
        encoded.extend_from_slice(value.as_bytes());
    }
    sha256_hex(&encoded)
}
