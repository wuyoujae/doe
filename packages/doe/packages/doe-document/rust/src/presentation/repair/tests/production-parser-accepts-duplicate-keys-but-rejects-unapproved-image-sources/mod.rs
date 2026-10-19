// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::production_parser_accepts_duplicate_keys_but_rejects_unapproved_image_sources
use super::*;


#[test]
pub(super) fn production_parser_accepts_duplicate_keys_but_rejects_unapproved_image_sources() {
    let duplicate = valid_deck(r#""first","text":"second""#);
    let processed = process_one(&duplicate, true).unwrap();
    assert_eq!(
        processed.parsed.slides[0]["blocks"][0]["props"]["text"],
        "second"
    );

    let image = valid_deck(r#""image""#).replace(
        r#""blocks":["#,
        r#""background":{"enabled":true,"src":"https://assets.example.com/image.png"},"blocks":["#,
    );
    assert!(process_one(&image, true)
        .unwrap_err()
        .starts_with(crate::presentation::schema::contract::ASSET_REFERENCE_MISMATCH_ERROR));
}
