// Origin: app/backend/core/src/outline_recovery/snapshot.rs::clause_spans


pub fn clause_spans(request: &str) -> Vec<(usize, usize)> {
    let mut spans = Vec::new();
    let mut start = 0usize;
    for (offset, character) in request.char_indices() {
        if matches!(
            character,
            '。' | '！' | '？' | '；' | '，' | '\n' | '.' | '!' | '?' | ';' | ','
        ) {
            if start < offset {
                spans.push((start, offset));
            }
            start = offset + character.len_utf8();
        }
    }
    if start < request.len() {
        spans.push((start, request.len()));
    }
    spans
}
