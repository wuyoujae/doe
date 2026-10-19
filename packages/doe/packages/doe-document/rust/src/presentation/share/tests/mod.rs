use super::*;
use serde_json::json;
#[path = "shared-deck-removes-private-notes-and-asset-references-in-notes/mod.rs"]
mod shared_deck_removes_private_notes_and_asset_references_in_notes;
#[path = "shared-contents-keeps-its-renderer-without-exposing-presentation-metadata/mod.rs"]
mod shared_contents_keeps_its_renderer_without_exposing_presentation_metadata;

#[test]
fn logo_assets_follow_visible_share_inheritance() {
    let default_id = "a".repeat(64);
    let override_id = "b".repeat(64);
    let mut deck = json!({"logo":{"src":format!("yrkie-asset-data://{default_id}")},"deck":{"slides":[
        {"logo":null,"blocks":[]},
        {"logo":{"src":format!("yrkie-asset-data://{override_id}")},"blocks":[]}
    ]}});
    let mut inherited = deck.clone();
    inherited["deck"]["slides"][0].as_object_mut().unwrap().remove("logo");
    strip_private(&mut inherited);
    assert!(references_asset(&inherited, &default_id));
    assert!(references_asset(&inherited, &override_id));
    strip_private(&mut deck);
    assert!(!references_asset(&deck, &default_id));
    assert!(references_asset(&deck, &override_id));
}
