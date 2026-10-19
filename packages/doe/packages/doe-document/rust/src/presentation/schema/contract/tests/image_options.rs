use super::*;

const OPTIONS: &[(&str, &[&str])] = &[
    ("imageSize", &["compact", "full"]),
    ("imageFit", &["contain", "cover"]),
    ("imageAspectRatio", &["1:1", "4:3", "3:4", "16:9"]),
    ("surface", &["none", "soft"]),
];

fn cases() -> Vec<(&'static str, Value)> {
    vec![
        ("image-text", json!({"src":"https://example.com/image.png","alt":"Original image","title":"Original title","text":"Original fact"})),
        ("contents", json!({"presentation":"image-text","items":[{"id":"image-1","src":"https://example.com/image.png","alt":"Original image","title":"Original title","text":"Original fact"}]})),
    ]
}

#[test]
fn image_options_preserve_authoring_storage_recovery_and_omission() {
    let allowed = vec!["https://example.com/image.png".to_string()];
    for (kind, original) in cases() {
        let mut variants = vec![original.clone()];
        for size in OPTIONS[0].1 { for fit in OPTIONS[1].1 { for aspect in OPTIONS[2].1 { for surface in OPTIONS[3].1 {
            let mut props = original.clone();
            for (key, value) in [("imageSize",size),("imageFit",fit),("imageAspectRatio",aspect),("surface",surface)] { props[key] = json!(value); }
            variants.push(props);
        }}}}
        for props in variants {
            let value = deck_with_leaf(kind, props.clone());
            validate_authorable_deck_value(&value, expectations()).unwrap();
            validation::validate_slide(&value["deck"]["slides"][0]).unwrap();
            let saved = parse_and_validate_work_editor_deck(&value.to_string(), expectations()).unwrap();
            assert_eq!(saved.slides[0]["blocks"][0]["props"], props, "{kind}");
            let recovered = crate::presentation::recovery::recover_agent_deck(&value.to_string(), expectations(), &allowed).unwrap();
            assert_eq!(recovered.parsed.slides[0]["blocks"][0]["props"], props, "{kind}");
        }
    }
}

#[test]
fn image_options_reject_invalid_values_and_wrong_component_scopes() {
    for (kind, original) in cases() {
        for (key, _) in OPTIONS {
            for invalid in [Value::Null, json!(7), json!(true), json!("unsupported"), json!(["full"]), json!({"value":"full"})] {
                let mut props = original.clone(); props[*key] = invalid;
                let value = deck_with_leaf(kind, props);
                let error = validate_authorable_deck_value(&value, expectations()).unwrap_err();
                assert!(error.contains(key), "{kind}/{key}: {error}");
                assert!(parse_and_validate_agent_deck(&value.to_string(), expectations(), &[]).is_err());
            }
        }
    }
    for (key, values) in OPTIONS {
        for presentation in ["icon-text", "cards:filled", "metrics"] {
            let props = json!({"presentation":presentation,"items":[{"id":"a","title":"Original","text":"Body"}],*key:values[0]});
            let error = validate_authorable_deck_value(&deck_with_leaf("contents", props), expectations()).unwrap_err();
            assert!(error.contains(key), "{presentation}/{key}: {error}");
        }
        let props = json!({"icon":"Leaf","title":"Original","text":"Body",*key:values[0]});
        assert!(validate_authorable_deck_value(&deck_with_leaf("icon-text", props), expectations()).unwrap_err().contains(key));
        let mut props = cases()[1].1.clone(); props["items"][0][*key] = json!(values[0]);
        assert!(validate_authorable_deck_value(&deck_with_leaf("contents", props), expectations()).unwrap_err().contains(key));
    }
}

#[test]
fn image_options_are_optional_provider_fields_with_exact_enums() {
    for (kind, _) in cases() {
        let response = component_props_response_schema(kind);
        for (key, values) in OPTIONS {
            assert_eq!(response["properties"][*key]["enum"], json!(values));
            assert!(!response["required"].as_array().unwrap().contains(&json!(key)));
        }
    }
    let response = component_props_response_schema("icon-text");
    for (key, _) in OPTIONS { assert!(response["properties"].get(key).is_none()); }
}
