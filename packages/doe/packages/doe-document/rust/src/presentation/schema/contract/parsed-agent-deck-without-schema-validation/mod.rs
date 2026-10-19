// Origin: app/backend/core/src/slide_agent_output_contract.rs::parsed_agent_deck_without_schema_validation
use super::*;


/// Adapts parsed Slide Agent JSON to the minimum shape required by Schema Deck
/// persistence without running any DOE structure, component, enum, range, or
/// page-count validator. The strict validators remain available for diagnostics
/// and tests, but the production generation path intentionally does not call
/// them.
pub fn parsed_agent_deck_without_schema_validation(
    mut value: Value,
    image_source_repair_count: usize,
) -> Result<ParsedSlideDeck, String> {
    if !value.is_object() {
        let agent_output = std::mem::take(&mut value);
        value = json!({
            "version": 4,
            "pageNumber": SlidePageNumber::default(),
            "deck": {
                "title": "Untitled presentation",
                "theme": "yrkie-theme",
                "slides": [],
                "agentOutput": agent_output
            }
        });
    }

    let root = value
        .as_object_mut()
        .expect("non-object Agent output is wrapped before storage adaptation");
    root.insert("version".to_string(), Value::Number(4.into()));

    let root_title = root
        .get("title")
        .and_then(Value::as_str)
        .filter(|title| !title.trim().is_empty())
        .unwrap_or("Untitled presentation")
        .to_string();
    let root_slides = root.remove("slides");
    let deck_value = root
        .entry("deck".to_string())
        .or_insert_with(|| Value::Object(Map::new()));
    if !deck_value.is_object() {
        let agent_output = std::mem::take(deck_value);
        let mut deck = Map::new();
        if agent_output.is_array() {
            deck.insert("slides".to_string(), agent_output);
        } else {
            deck.insert("slides".to_string(), Value::Array(Vec::new()));
            deck.insert("agentOutput".to_string(), agent_output);
        }
        *deck_value = Value::Object(deck);
    }

    let deck = deck_value
        .as_object_mut()
        .expect("non-object Deck is wrapped before storage adaptation");
    if !deck
        .get("title")
        .and_then(Value::as_str)
        .is_some_and(|title| !title.trim().is_empty())
    {
        deck.insert("title".to_string(), Value::String(root_title));
    }
    if !deck.get("slides").is_some_and(Value::is_array) {
        deck.insert(
            "slides".to_string(),
            root_slides
                .filter(Value::is_array)
                .unwrap_or_else(|| Value::Array(Vec::new())),
        );
    }

    let slides = deck
        .get_mut("slides")
        .and_then(Value::as_array_mut)
        .expect("storage adapter always creates a Slides array");
    let mut slide_ids = HashSet::new();
    for (index, slide) in slides.iter_mut().enumerate() {
        if !slide.is_object() {
            let agent_output = std::mem::take(slide);
            *slide = json!({
                "blocks": [],
                "agentOutput": agent_output
            });
        }
        let slide = slide
            .as_object_mut()
            .expect("non-object Slide is wrapped before storage adaptation");
        let existing_id = slide
            .get("id")
            .and_then(Value::as_str)
            .filter(|id| !id.trim().is_empty())
            .map(str::to_string);
        let slide_id = match existing_id {
            Some(id) if slide_ids.insert(id.clone()) => id,
            _ => {
                let mut candidate = format!("slide-{:02}", index + 1);
                let mut suffix = 2usize;
                while !slide_ids.insert(candidate.clone()) {
                    candidate = format!("slide-{:02}-{suffix}", index + 1);
                    suffix += 1;
                }
                candidate
            }
        };
        slide.insert("id".to_string(), Value::String(slide_id));
        if !slide.get("size").is_some_and(Value::is_object) {
            slide.insert(
                "size".to_string(),
                json!({"width": 960, "height": 540, "unit": "pt"}),
            );
        }
        if !slide.get("blocks").is_some_and(Value::is_array) {
            slide.insert("blocks".to_string(), Value::Array(Vec::new()));
        }
    }

    normalize_page_number(&mut value);
    normalize_theme(&mut value);
    parsed_deck_from_valid_value(value, image_source_repair_count)
}
