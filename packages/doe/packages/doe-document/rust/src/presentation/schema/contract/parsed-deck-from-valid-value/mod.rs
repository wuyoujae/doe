// Origin: app/backend/core/src/slide_agent_output_contract.rs::parsed_deck_from_valid_value
use super::*;


pub fn parsed_deck_from_valid_value(
    mut value: Value,
    image_source_repair_count: usize,
) -> Result<ParsedSlideDeck, String> {
    normalize_retired_text_roles(&mut value);
    let root = value.as_object().expect("validated root");
    let deck = root["deck"].as_object().expect("validated deck");
    let page_number = serde_json::from_value::<SlidePageNumber>(root["pageNumber"].clone())
        .map_err(|error| format!("{SCHEMA_MISMATCH_ERROR}: {error}"))?;
    let canonical_json = serde_json::to_string(&value)
        .map_err(|error| format!("{OUTPUT_CONTRACT_VIOLATION_ERROR}: {error}"))?;
    Ok(ParsedSlideDeck {
        version: 4,
        page_number,
        logo: root.get("logo").cloned().unwrap_or(Value::Null),
        title: deck["title"].as_str().expect("validated title").to_string(),
        theme: deck["theme"].as_str().expect("validated theme").to_string(),
        slides: deck["slides"].as_array().expect("validated slides").clone(),
        canonical_json,
        image_source_repair_count,
    })
}
