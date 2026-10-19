use super::*;
#[test]
    fn shared_deck_removes_private_notes_and_asset_references_in_notes() {
        let id = "a".repeat(64);
        let mut value = json!({"notes":format!("yrkie-asset-data://{id}"),"slides":[{"speakerNotes":"private","editor":true,"presentation":{"notes":"private"},"blocks":[{"props":{"text":"Visible"}}]}]});
        strip_private(&mut value);
        assert!(!references_asset(&value, &id));
        assert_eq!(value["slides"][0]["editor"], false);
        assert_eq!(value["slides"][0]["blocks"][0]["props"]["text"], "Visible");
        assert!(value.to_string().find("private").is_none());
        assert!(references_asset(
            &json!({"props":{"src":format!("yrkie-asset-data://{id}")}}),
            &id
        ));
    }
