
    use super::*;
    fn page() -> Value {
        json!({"id":"slide-1","size":{"width":960,"height":540,"unit":"pt"},"blocks":[{"id":"heading-1","type":"heading","props":{"text":"Evidence"}}]})
    }

    #[test]
    fn serialized_containers_are_rejected_but_json_code_remains_string_data() {
        let mut slide = page();
        let items = (1..=6).map(|index| json!({
            "title":format!("Topic {index}"), "text":format!("Existing explanation {index}"), "icon":"Target"
        })).collect::<Vec<_>>();
        slide["blocks"].as_array_mut().unwrap().push(json!({
            "id":"cards", "type":"numbered-icon-cards", "props":{"content":{"items":items}}
        }));
        deck(&envelope(slide.clone()), 1, "/slide").expect("six real items are valid");
        for path in ["/blocks/0/props", "/blocks/1/props", "/blocks/1/props/content", "/blocks/1/props/content/items"] {
            let mut broken = slide.clone();
            let field = broken.pointer_mut(path).unwrap();
            *field = json!(field.to_string());
            assert!(deck(&envelope(broken), 1, "/slide").is_err(), "{path}");
        }
        slide["blocks"].as_array_mut().unwrap().push(json!({
            "id":"code", "type":"code-block", "props":{"language":"json", "code": "{\"enabled\":true}"}
        }));
        deck(&envelope(slide), 1, "/slide").expect("JSON source in a code string remains valid");
    }

    #[test]
    fn skills_reference_examples_pass_the_external_authoring_boundary() {
        let reference = include_str!("../../../../../../src/document/presentation/schema/authoring/default-prompts/skills-schema.md");
        let fixtures: Value =
            serde_json::from_str(include_str!("../../../../../../src/document/presentation/schema/authoring/schemas/doe-slide-v4.examples.json")).unwrap();
        let mut roots: Vec<Value> = fixtures["cases"]
            .as_array()
            .unwrap()
            .iter()
            .map(|case| case["root"].clone())
            .collect();
        let fixture_count = roots.len();
        assert!(fixture_count > 0, "authoring fixtures must not be empty");
        for section in reference.split("```json").skip(1) {
            let raw = section.split("```").next().unwrap().trim();
            let value = check::parse_with_limit(raw.as_bytes(), MAX_REQUEST_BYTES)
                .expect("strict example JSON");
            if let Some(nodes) = value.as_array() {
                roots.extend(nodes.iter().map(|node| {
                    envelope(json!({
                        "id":"s1","size":{"width":960,"height":540,"unit":"pt"},"blocks":[node]
                    }))
                }));
            } else if value.get("projectRef").is_some() {
                if let Some(document) = value.get("deck") {
                    roots.push(document.clone());
                } else {
                    roots.push(envelope(value["slide"].clone()));
                }
            } else {
                roots.push(value);
            }
        }
        assert!(roots.len() > fixture_count, "the skills reference must contribute executable examples");
        for (index, root) in roots.iter().enumerate() {
            deck(root, 1, "/deck").unwrap_or_else(|e| panic!("example {index}: {e:?}"));
            // Each fixture uses a single fictional source. Supply compatible synthetic
            // manifest metadata; this tests placement, not live project authorization.
            let edge = &root["deck"]["slides"][0]["blocks"][0]["layout"];
            let portrait = edge["variant"] == "edge-media"
                && matches!(edge["mediaPosition"].as_str(), Some("left" | "right"));
            let manifest = vec![json!({
                "slideReference":format!("yrkie-asset-data://{}", "a".repeat(64)),
                "imageType":"decorative","ratio":if portrait {"9:16"} else {"16:9"}
            })];
            assets(root, &manifest).unwrap_or_else(|e| panic!("example {index} assets: {e:?}"));
        }
    }

    #[test]
    fn skills_reference_text_restrictions_apply_to_code_and_formulas() {
        for text in [
            "<div>Example</div>",
            "a<b",
            "metadata: value",
            "URL (image)",
            "expression (1)",
            "javascript : x",
            "A\r\nB",
            "A\u{202e}B",
        ] {
            let mut document = envelope(page());
            document["deck"]["slides"][0]["blocks"][0] = json!({
                "id":"code","type":"code-block","props":{"code":text,"language":"text"}
            });
            assert!(
                deck(&document, 1, "/deck").is_err(),
                "rejected literal: {text:?}"
            );
        }
        for text in ["A\nB\tC", "a < b", "print(1)"] {
            let mut document = envelope(page());
            document["deck"]["slides"][0]["blocks"][0] = json!({
                "id":"formula","type":"math-formula","props":{"content":{"formula":text}}
            });
            assert!(
                deck(&document, 1, "/deck").is_ok(),
                "allowed plain syntax: {text:?}"
            );
        }
        let document = envelope(page());
        let encoded = document
            .to_string()
            .replace("Evidence", r"\u003cdiv\u003eExample\u003c/div\u003e");
        let decoded = check::parse_with_limit(encoded.as_bytes(), MAX_REQUEST_BYTES).unwrap();
        assert!(
            deck(&decoded, 1, "/deck").is_err(),
            "JSON escaping must not bypass decoded-string checks"
        );
    }

    #[test]
    fn skills_reference_asset_table_matches_manifest_and_placement_checks() {
        let fixtures: Value =
            serde_json::from_str(include_str!("../../../../../../src/document/presentation/schema/authoring/schemas/doe-slide-v4.examples.json")).unwrap();
        for (name, image_type, ratio, accepted) in [
            ("media", "content", "1:1", true),
            ("background-flow", "decorative", "16:9", true),
            ("background-disabled", "content", "16:9", false),
            ("background-flow", "decorative", "9:16", false),
            ("edge-straight", "decorative", "4:5", true),
            ("edge-straight", "decorative", "16:9", false),
            ("edge-straight", "content", "9:16", false),
            ("edge-diagonal", "decorative", "4:3", true),
            ("edge-diagonal", "decorative", "3:4", false),
        ] {
            let root = &fixtures["cases"]
                .as_array()
                .unwrap()
                .iter()
                .find(|case| case["name"] == name)
                .unwrap()["root"];
            let manifest = vec![
                json!({"slideReference":format!("yrkie-asset-data://{}", "a".repeat(64)),"imageType":image_type,"ratio":ratio}),
            ];
            assert_eq!(
                assets(root, &manifest).is_ok(),
                accepted,
                "{name}/{image_type}/{ratio}"
            );
            assert_eq!(assets(root, &[]).unwrap_err().error, "asset_unavailable");
        }
        for source in [
            "https://example.invalid/image.png".to_string(),
            format!("yrkie-asset-base64://{}", "a".repeat(64)),
        ] {
            let mut root = envelope(page());
            root["deck"]["slides"][0]["blocks"][0] =
                json!({"id":"media","type":"media","props":{"src":source,"alt":"Image"}});
            assert!(deck(&root, 1, "/deck").is_err());
        }
    }
    #[test]
    fn strict_schema_rejects_untrusted_shapes_without_repair() {
        let good = envelope(page());
        assert!(deck(&good, 1, "/deck").is_ok());
        for (pointer, value) in [
            ("/version", json!(3)),
            ("/deck/slides/0/size/width", json!(1920)),
            ("/deck/slides/0/blocks/0/type", json!("unknown")),
            ("/deck/slides/0/blocks/0/props/text", Value::Null),
        ] {
            let mut bad = good.clone();
            *bad.pointer_mut(pointer).unwrap() = value;
            let error = deck(&bad, 1, "/deck").unwrap_err();
            assert_eq!(error.error, "validation_failed");
            assert!(!error.issues.is_empty());
        }
        let mut bad = good.clone();
        bad["deck"]["slides"][0]["editor"] = json!(true);
        assert!(deck(&bad, 1, "/deck").is_err());
        let mut bad = good.clone();
        bad["deck"]["slides"].as_array_mut().unwrap().push(page());
        assert!(deck(&bad, 2, "/deck").is_err());
        assert!(deck(&good, 2, "/deck").is_err());
    }
    #[test]
    fn static_svg_allowed_but_active_svg_and_namespace_tricks_rejected() {
        assert!(safe_svg(
            r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 2 L3 4"/></svg>"##
        ));
        for svg in [
            r#"<svg onload="alert(1)"/>"#,
            r#"<svg><script/></svg>"#,
            r#"<svg><foreignObject/></svg>"#,
            r##"<svg><use href="#x"/></svg>"##,
            r#"<svg style="fill:red"/>"#,
            r#"<svg fill="url(https://example.invalid/x)"/>"#,
            r#"<svg xmlns="http://evil.invalid"/>"#,
            r#"<!DOCTYPE svg><svg/>"#,
            r#"<svg><image/></svg>"#,
            r#"<svg><path onclick="x"/></svg>"#,
        ] {
            assert!(!safe_svg(svg), "{svg}");
        }
        let mut good = envelope(page());
        good["deck"]["slides"][0]["blocks"][0] = json!({"id":"hero-1","type":"hero","props":{"title":"Title","icon":"<svg><path d=\"M0 0 L1 1\"/></svg>"}});
        assert!(deck(&good, 1, "/deck").is_ok());
    }
    #[test]
    fn input_budget_duplicate_keys_and_resource_paths_fail_closed() {
        for input in [
            br#"{"x":1,"x":2}"#.as_slice(),
            br#"{} trailing"#,
            br#"{"x":1e999}"#,
        ] {
            assert!(check::parse_with_limit(input, MAX_REQUEST_BYTES).is_err());
        }
        assert_eq!(
            check::parse_with_limit(&vec![b' '; 10], 9)
                .unwrap_err()
                .error,
            "request_too_large"
        );
        let nested = format!("{}0{}", "[".repeat(33), "]".repeat(33));
        assert!(check::parse_with_limit(nested.as_bytes(), MAX_REQUEST_BYTES).is_err());
        for value in [
            "<img src=x onerror=alert(1)>",
            "javascript:alert(1)",
            "data:image/png;base64,x",
            "\u{202e}hidden",
        ] {
            let mut bad = envelope(page());
            bad["deck"]["slides"][0]["blocks"][0]["props"]["text"] = json!(value);
            assert!(deck(&bad, 1, "/deck").is_err());
        }
        let mut bad = envelope(page());
        bad["deck"]["__proto__"] = json!({});
        assert!(deck(&bad, 1, "/deck").is_err());
    }
    #[test]
    fn asset_references_must_match_the_project_manifest_exactly() {
        let source = format!("yrkie-asset-data://{}", "a".repeat(64));
        let document =
            json!({"deck":{"slides":[{"blocks":[{"type":"media","props":{"src":source}}]}]}});
        assert_eq!(
            assets(&document, &[]).unwrap_err().error,
            "asset_unavailable"
        );
        assert!(assets(
            &document,
            &[json!({"slideReference":source,"imageType":"content","ratio":"4:3"})]
        )
        .is_ok());
        let mut invalid = document.clone();
        invalid["deck"]["slides"][0]["blocks"][0]["props"]["src"] =
            json!("https://localhost/private");
        assert!(assets(&invalid, &[]).is_err());
    }
    
