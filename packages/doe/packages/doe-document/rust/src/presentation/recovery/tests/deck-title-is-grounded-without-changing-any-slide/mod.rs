// Origin: app/backend/core/src/slide_recovery/tests.rs::deck_title_is_grounded_without_changing_any_slide
use super::*;


#[test]
pub(super) fn deck_title_is_grounded_without_changing_any_slide() {
    let value = deck(vec![valid_slide("slide-1", "年度经营成果")]);
    let recovered = recover_agent_deck(&value.to_string(), expectations(1), &[]).unwrap();
    let slide_hash = canonical_value_sha256(&recovered.parsed.slides[0]);
    let context = json!({
        "confirmed_outline": {"outline": {
            "title": "公司年度经营汇报",
            "slides": [{
                "page_number": 1,
                "contents": {"title": {"body": "年度经营成果"}}
            }]
        }}
    });

    let recovered = enforce_grounded_deck_title(recovered, &context, true).unwrap();
    assert_eq!(recovered.parsed.title, "公司年度经营汇报");
    assert_eq!(
        recovered.proof.disposition,
        SlideRecoveryDisposition::DeterministicRepair
    );
    assert_eq!(
        recovered.proof.edits.last().unwrap().code,
        "outline.deck_title_grounding"
    );
    assert_eq!(
        canonical_value_sha256(&recovered.parsed.slides[0]),
        slide_hash
    );

    let strict = recover_agent_deck(&value.to_string(), expectations(1), &[]).unwrap();
    assert_eq!(
        enforce_grounded_deck_title(strict, &context, false).unwrap_err(),
        "slide_recovery_disabled_deck_title_ungrounded"
    );
}
