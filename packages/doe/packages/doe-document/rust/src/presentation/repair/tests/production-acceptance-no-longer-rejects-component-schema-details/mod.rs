// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::production_acceptance_no_longer_rejects_component_schema_details
use super::*;


#[test]
pub(super) fn production_acceptance_no_longer_rejects_component_schema_details() {
    let mut value = serde_json::from_str::<Value>(&valid_deck(r#""plain""#)).unwrap();
    value["deck"]["slides"][0]["blocks"][0]["props"]["futureRendererField"] =
        json!({"enabled": true});
    crate::presentation::schema::contract::validate_authorable_deck_value(
        &value,
        SlideDeckExpectations::new(1).unwrap(),
    )
    .expect_err("the authoring reference validator remains available for tests and diagnostics");

    let processed = process_one(&value.to_string(), true).unwrap();
    assert_eq!(
        processed.parsed.slides[0]["blocks"][0]["props"]["futureRendererField"]["enabled"],
        true
    );
}
