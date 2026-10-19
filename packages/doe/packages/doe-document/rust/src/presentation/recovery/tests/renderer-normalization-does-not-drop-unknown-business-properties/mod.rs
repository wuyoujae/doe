// Origin: app/backend/core/src/slide_recovery/tests.rs::renderer_normalization_does_not_drop_unknown_business_properties
use super::*;


#[test]
pub(super) fn renderer_normalization_does_not_drop_unknown_business_properties() {
    let mut slide = valid_slide("slide-1", "Business property");
    slide["blocks"][0]["props"]["unknownBusinessFact"] =
        Value::String("must remain for explicit repair".to_string());
    let recovered =
        recover_agent_deck(&deck(vec![slide]).to_string(), expectations(1), &[]).unwrap();
    let normalized = repair_known_renderer_incompatibilities(recovered).unwrap();
    assert_eq!(
        normalized.proof.disposition,
        SlideRecoveryDisposition::Original
    );
    let value = serde_json::from_str::<Value>(&normalized.parsed.canonical_json).unwrap();
    assert_eq!(
        value["deck"]["slides"][0]["blocks"][0]["props"]["unknownBusinessFact"],
        "must remain for explicit repair"
    );
}
