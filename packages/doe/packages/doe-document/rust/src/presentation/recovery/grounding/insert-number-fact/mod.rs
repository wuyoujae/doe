// Origin: app/backend/core/src/slide_recovery/grounding.rs::insert_number_fact
use super::*;


pub(super) fn insert_number_fact(value: &str, output: &mut GuardedFacts) {
    let display_normalized = normalize(value);
    if !display_normalized.is_empty() {
        output.strings.insert(display_normalized);
    }
    for number in number_tokens(value) {
        let normalized = normalize(&number);
        output.numbers.insert(number);
        if normalized.chars().count() >= 1 {
            output.strings.insert(normalized);
        }
    }
}
