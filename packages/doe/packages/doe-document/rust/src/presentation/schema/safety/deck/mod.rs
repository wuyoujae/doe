// Origin: app/backend/core/src/plugin_slide_validation.rs::deck
use super::*;


pub fn deck(
    value: &Value,
    count: usize,
    prefix: &str,
) -> Result<contract::ParsedSlideDeck, Failure> {
    let mut errors = Failure::from("validation_failed");
    safety(value, prefix, "", &mut errors, &mut 0);
    if let Some(slides) = value["deck"]["slides"].as_array() {
        for (i, slide) in slides.iter().enumerate() {
            if slide.to_string().len() > MAX_SLIDE_BYTES {
                errors.issue(
                    &format!("{prefix}/deck/slides/{i}"),
                    "slide_size",
                    "A slide exceeds 2,000,000 UTF-8 bytes.",
                    "Reduce this page's content or SVG path complexity.",
                );
            }
        }
    }
    errors.finish()?;
    let expectations =
        contract::SlideDeckExpectations::new(count).map_err(|e| diagnostic(&e, prefix))?;
    contract::validate_authorable_deck_value(value, expectations)
        .map_err(|e| diagnostic(&e, prefix))?;
    contract::parsed_deck_from_valid_value(value.clone(), 0)
        .map_err(|_| Failure::from("temporarily_unavailable"))
}
