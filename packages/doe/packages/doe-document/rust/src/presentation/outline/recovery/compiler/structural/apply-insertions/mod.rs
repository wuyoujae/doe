// Origin: app/backend/core/src/outline_recovery/compiler/structural.rs::apply_insertions
use super::*;


pub(super) fn apply_insertions(source: &str, insertions: &[(usize, char, &'static str, usize)]) -> String {
    if insertions.is_empty() {
        return source.to_string();
    }
    let mut grouped = BTreeMap::<usize, Vec<char>>::new();
    for (offset, token, _, _) in insertions {
        grouped.entry(*offset).or_default().push(*token);
    }
    let mut output = String::with_capacity(source.len() + insertions.len());
    let mut cursor = 0usize;
    for (offset, tokens) in grouped {
        output.push_str(&source[cursor..offset]);
        for token in tokens {
            output.push(token);
        }
        cursor = offset;
    }
    output.push_str(&source[cursor..]);
    output
}
