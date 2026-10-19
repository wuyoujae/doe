// Origin: app/backend/core/src/slide_agent_output_contract.rs::normalize_theme
use super::*;

// The legacy contract placed a palette id on each Slide. Registered themes are
// now owned by Deck, so canonicalization migrates stored Decks and
// strips every obsolete per-Slide theme before strict validation or tolerant
// production storage.
pub(super) fn normalize_theme(value: &mut Value) {
    let Some(root) = value.as_object_mut() else {
        return;
    };
    let Some(deck) = root.get_mut("deck").and_then(Value::as_object_mut) else {
        return;
    };
    let theme = registered_theme_id(deck.get("theme").and_then(Value::as_str));
    deck.insert(
        "theme".to_string(),
        Value::String(theme.to_string()),
    );
    let Some(slides) = deck.get_mut("slides").and_then(Value::as_array_mut) else {
        return;
    };
    for slide in slides {
        if let Some(slide) = slide.as_object_mut() {
            slide.remove("theme");
        }
    }
}
