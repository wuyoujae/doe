use super::*;

fn cases() -> Vec<(&'static str, Value)> {
    let mut cases = Vec::new();
    for variant in ["semicircle", "petals", "cycle-arrows", "full-circle", "ring", "stairs", "pyramid", "inverted-pyramid"] {
        cases.push(("shape-contents", json!({"variant":variant,"items":[
            {"title":"Select","text":"Match the light","icon":"Flower2"},
            {"title":"Care","text":"Keep the stated schedule","icon":"Droplets"}
        ]})));
    }
    for kind in ["folded-arrow", "wave-arrow", "layered-cube", "double-ring", "droplet-process", "recycling-arrows"] {
        let count = if matches!(kind, "wave-arrow" | "recycling-arrows") { 3 } else { 2 };
        let items = (0..count).map(|i| {
            let mut item = json!({"title":format!("Stage {i}"),"text":"Original fact","icon":"Package"});
            if kind == "double-ring" { item["side"] = json!(if i == 0 { "left" } else { "right" }); }
            item
        }).collect::<Vec<_>>();
        cases.push((kind, json!({"items":items})));
    }
    for index in [None, Some(json!(7)), Some(json!("Q2"))] {
        let mut props = json!({"title":"Original question","text":"Original answer","icon":"CircleHelp"});
        if let Some(index) = index { props["index"] = index; }
        cases.push(("question-card", props));
    }
    cases
}

#[test]
fn optional_icons_preserve_authoring_storage_and_recovery_without_defaults() {
    for (kind, props) in cases() {
        for with_icons in [true, false] {
            let mut props = props.clone();
            if !with_icons {
                if kind == "question-card" { props.as_object_mut().unwrap().remove("icon"); }
                else { for item in props["items"].as_array_mut().unwrap() { item.as_object_mut().unwrap().remove("icon"); } }
            }
            let value = deck_with_leaf(kind, props.clone());
            validate_authorable_deck_value(&value, expectations()).unwrap();
            let saved = parse_and_validate_work_editor_deck(&value.to_string(), expectations()).unwrap();
            assert_eq!(saved.slides[0]["blocks"][0]["props"], props, "{kind}");
            let recovered = crate::presentation::recovery::recover_agent_deck(&value.to_string(), expectations(), &[]).unwrap();
            assert_eq!(recovered.parsed.slides[0]["blocks"][0]["props"], props, "{kind}");
        }
    }
}

#[test]
fn optional_icons_reject_invalid_json_types_at_the_agent_boundary() {
    for (kind, props) in cases() {
        for invalid in [Value::Null, json!(12), json!(false), json!({"name":"Leaf"}), json!(["Leaf"])] {
            let mut invalid_props = props.clone();
            if kind == "question-card" { invalid_props["icon"] = invalid; }
            else { invalid_props["items"][0]["icon"] = invalid; }
            let value = deck_with_leaf(kind, invalid_props);
            assert!(validate_authorable_deck_value(&value, expectations()).is_err(), "{kind}");
            assert!(parse_and_validate_agent_deck(&value.to_string(), expectations(), &[]).is_err(), "{kind}");
        }
    }
}

#[test]
fn optional_icons_are_visible_but_not_required_in_provider_response_schema() {
    for (kind, _) in cases() {
        let response = component_props_response_schema(kind);
        let schema = if kind == "question-card" { &response } else { &response["properties"]["items"]["items"] };
        assert_eq!(schema["properties"]["icon"]["type"], "string", "{kind}");
        assert!(!schema["required"].as_array().unwrap().contains(&json!("icon")), "{kind}");
    }
}
