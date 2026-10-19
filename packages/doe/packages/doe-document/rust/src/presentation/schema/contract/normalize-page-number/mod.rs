// Origin: app/backend/core/src/slide_agent_output_contract.rs::normalize_page_number
use super::*;

// pageNumber is a Deck-level preference, not structural Slide content. Keep
// the canonical stored/rendered shape stable while accepting older or
// hand-authored Decks that omit it. Invalid or partial settings fall back per
// field instead of rejecting otherwise renderable Slides.
pub(super) fn normalize_page_number(value: &mut Value) {
    let Some(root) = value.as_object_mut() else {
        return;
    };
    let source = root.get("pageNumber").and_then(Value::as_object);
    let enabled = source
        .and_then(|page_number| page_number.get("enabled"))
        .and_then(Value::as_bool)
        .unwrap_or(true);
    let format = match source
        .and_then(|page_number| page_number.get("format"))
        .and_then(Value::as_str)
    {
        Some("fraction") => SlidePageNumberFormat::Fraction,
        _ => SlidePageNumberFormat::Number,
    };
    root.insert(
        "pageNumber".to_string(),
        serde_json::to_value(SlidePageNumber { enabled, format })
            .expect("SlidePageNumber serialization cannot fail"),
    );
}
