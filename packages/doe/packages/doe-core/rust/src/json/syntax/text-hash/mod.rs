// Origin: app/backend/core/src/json_syntax_repair.rs::text_hash
use super::*;


pub(super) fn text_hash(text: &str) -> u64 {
    let mut hasher = DefaultHasher::new();
    text.hash(&mut hasher);
    hasher.finish()
}
