use super::*;

#[test]
fn uses_declared_final_document_without_merging_draft_content() {
    let draft = valid_deck(r#""Draft title and data 123""#);
    let final_json = valid_deck(r#""最终说明与数据 456""#);
    let raw = format!(
        "{draft}\n\nWait: the draft has an error.\n\nFinal corrected JSON:\n\n{final_json}"
    );
    let output = process_one(&raw, true).unwrap();
    assert_eq!(
        output.parsed.canonical_json,
        process_one(&final_json, true)
            .unwrap()
            .parsed
            .canonical_json
    );
    assert_eq!(
        output.proof.operations,
        vec![SlideAutoRepairV2Operation::ExplicitFinalJsonSelected]
    );
    assert_eq!(output.proof.input_bytes, raw.len());
    assert_eq!(output.proof.input_sha256, sha256_hex(raw.as_bytes()));
    assert_eq!(
        output.proof.output_sha256,
        sha256_hex(final_json.as_bytes())
    );
}

#[test]
fn repairs_extra_closer_in_declared_final_after_a_broken_draft_and_example() {
    let final_json = valid_deck(r#""中英文正文 remains unchanged""#);
    let malformed = format!("{}]}}", &final_json[..final_json.len() - 1]);
    let raw = format!("{malformed}\n\nWait: example {{\"categories\":[...]}}.\n\nFinal corrected JSON:\n\n{malformed}");
    let output = process_one(&raw, true).unwrap();
    assert_eq!(
        output.parsed.canonical_json,
        process_one(&final_json, true)
            .unwrap()
            .parsed
            .canonical_json
    );
    assert!(output
        .proof
        .operations
        .contains(&SlideAutoRepairV2Operation::JsonSyntaxRepaired));
    assert!(output
        .proof
        .operations
        .contains(&SlideAutoRepairV2Operation::ExplicitFinalJsonSelected));
}

#[test]
fn accepts_final_json_fence_and_supported_declaration_formatting() {
    let final_json = valid_deck(r#""正文""#);
    for label in [
        "Final JSON:",
        "## Final corrected JSON:",
        "**Final corrected JSON:**",
        "最终修正后的 JSON：",
    ] {
        let raw = format!("Draft omitted.\r\n{label}\r\n```JSON\r\n{final_json}\r\n```");
        let output = process_one(&raw, true).unwrap();
        assert_eq!(
            output.proof.operations,
            vec![
                SlideAutoRepairV2Operation::ExplicitFinalJsonSelected,
                SlideAutoRepairV2Operation::JsonCodeFenceRemoved
            ]
        );
    }
}

#[test]
fn refuses_ambiguous_or_incomplete_final_regions() {
    let deck = valid_deck(r#""body""#);
    for raw in [
        format!("Final JSON:\n{deck}\nFinal corrected JSON:\n{deck}"),
        format!("Final corrected JSON:\n{deck}\n{deck}"),
        format!("Final corrected JSON:\n{deck}\nAdditional instructions."),
        "Final corrected JSON:\nNo JSON available".to_string(),
        "Final corrected JSON:\n{\"deck\":{\"slides\":\"incomplete\"}}".to_string(),
    ] {
        assert!(
            process_one(&raw, true).is_err(),
            "accepted ambiguous final region"
        );
    }
}

#[test]
fn declarations_inside_content_never_select_a_document() {
    let body =
        serde_json::to_string("Before\nFinal corrected JSON:\n{\"secret\":true}\nAfter").unwrap();
    let raw = valid_deck(&body);
    assert!(process_one(&raw, true).unwrap().proof.operations.is_empty());
    // Even malformed multiline strings must not create a framing declaration.
    assert_eq!(
        final_response::select("{\"text\":\"Before\nFinal corrected JSON:\n{}\nAfter\"}"),
        Ok(None)
    );
}

#[test]
fn selected_final_keeps_page_count_image_authorization_and_disable_switch() {
    let deck = valid_deck(r#""body""#);
    let raw = format!("{deck}\nFinal corrected JSON:\n{deck}");
    assert!(process_one(&raw, false).is_err());
    assert!(process_with_slide_count(&raw, 2, true).is_err());
    let image = deck.replace(
        r#""type":"text","props":{"text":"body"}"#,
        r#""type":"media","props":{"src":"https://unapproved.example/image.png"}"#,
    );
    assert!(process_one(&format!("Final JSON:\n{image}"), true).is_err());
}

#[test]
fn applies_byte_limit_before_discarding_the_draft() {
    use crate::presentation::schema::contract::{MAX_OUTPUT_BYTES, OUTPUT_TOO_LARGE_ERROR};
    let raw = format!(
        "{}\nFinal JSON:\n{}",
        " ".repeat(MAX_OUTPUT_BYTES),
        valid_deck(r#""body""#)
    );
    assert!(process_one(&raw, true)
        .unwrap_err()
        .starts_with(OUTPUT_TOO_LARGE_ERROR));
}
