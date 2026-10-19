// Origin: app/backend/core/src/slide_recovery/mod.rs::enforce_grounded_deck_title
use super::*;


pub fn enforce_grounded_deck_title(
    mut recovered: RecoveredSlideDeck,
    provider_context: &Value,
    allow_repair: bool,
) -> Result<RecoveredSlideDeck, String> {
    let authoritative = model_io::grounded_deck_title(provider_context)?;
    let current = recovered.parsed.title.trim();
    let normalize_title = |value: &str| {
        value
            .chars()
            .flat_map(char::to_lowercase)
            .filter(|character| character.is_alphanumeric())
            .collect::<String>()
    };
    if normalize_title(current) == normalize_title(&authoritative) {
        return Ok(recovered);
    }
    if !allow_repair {
        return Err("slide_recovery_disabled_deck_title_ungrounded".to_string());
    }

    let before = Value::String(recovered.parsed.title.clone());
    let after = Value::String(authoritative.clone());
    let mut deck = serde_json::from_str::<Value>(&recovered.parsed.canonical_json)
        .map_err(|error| format!("slide_recovery_title_candidate_invalid: {error}"))?;
    deck.get_mut("deck")
        .and_then(Value::as_object_mut)
        .ok_or_else(|| "slide_recovery_title_deck_missing".to_string())?
        .insert("title".to_string(), after.clone());
    let expectations = SlideDeckExpectations::new(recovered.parsed.slides.len())?;
    slide_agent_output_contract::validate_deck_value(&deck, expectations)?;
    recovered.parsed = slide_agent_output_contract::parsed_deck_from_valid_value(
        deck,
        recovered.parsed.image_source_repair_count,
    )?;
    if recovered.proof.disposition == SlideRecoveryDisposition::Original {
        recovered.proof.disposition = SlideRecoveryDisposition::DeterministicRepair;
    }
    recovered
        .proof
        .original_error
        .get_or_insert_with(|| "slide_agent_deck_title_ungrounded".to_string());
    recovered.proof.diagnostics.push(SlideDiagnostic {
        code: "outline.deck_title_ungrounded".to_string(),
        path: "root.deck.title".to_string(),
        message: "Deck title did not match the confirmed Outline title".to_string(),
        page_index: None,
        repairability: SlideRepairability::ContractUnique,
    });
    recovered.proof.edits.push(SlideRepairEdit {
        code: "outline.deck_title_grounding".to_string(),
        path: "root.deck.title".to_string(),
        action: "replace_with_confirmed_outline_title".to_string(),
        page_index: None,
        before_sha256: canonical_value_sha256(&before),
        after_sha256: canonical_value_sha256(&after),
        constraint: "the confirmed Outline title is the authoritative Deck title".to_string(),
    });
    recovered.proof.candidate_sha256 = sha256_hex(recovered.parsed.canonical_json.as_bytes());
    Ok(recovered)
}
