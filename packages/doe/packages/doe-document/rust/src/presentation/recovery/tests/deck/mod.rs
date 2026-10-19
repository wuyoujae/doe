// Origin: app/backend/core/src/slide_recovery/tests.rs::deck
use super::*;


pub(super) fn deck(slides: Vec<Value>) -> Value {
    json!({
        "version": 4,
        "pageNumber": {"enabled": true, "format": "number"},
        "deck": {"title": "Recovery", "theme": "yrkie-theme", "slides": slides}
    })
}
