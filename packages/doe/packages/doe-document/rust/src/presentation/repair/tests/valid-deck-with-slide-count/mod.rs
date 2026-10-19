// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::valid_deck_with_slide_count
use super::*;


pub(super) fn valid_deck_with_slide_count(slide_count: usize) -> String {
    let mut value = serde_json::from_str::<Value>(&valid_deck(r#""plain""#)).unwrap();
    let template = value["deck"]["slides"][0].clone();
    value["deck"]["slides"] = Value::Array(
        (0..slide_count)
            .map(|index| {
                let mut slide = template.clone();
                slide["id"] = Value::String(format!("slide-{}", index + 1));
                slide
            })
            .collect(),
    );
    value.to_string()
}
