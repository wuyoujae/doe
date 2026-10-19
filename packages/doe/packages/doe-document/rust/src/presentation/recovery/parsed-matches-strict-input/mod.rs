// Origin: app/backend/core/src/slide_recovery/mod.rs::parsed_matches_strict_input
use super::*;


pub(super) fn parsed_matches_strict_input(raw: &str, parsed: &ParsedSlideDeck) -> bool {
    if parsed.image_source_repair_count != 0 {
        return false;
    }
    let Ok(input) = duplicate_json::parse_strict(raw) else {
        return false;
    };
    serde_json::from_str::<Value>(&parsed.canonical_json).is_ok_and(|canonical| canonical == input)
}
