
    use super::*;

    mod icon_fields;
    mod image_options;

    #[test]
    fn work_editor_storage_preserves_contents_replacement_memory() {
        let mut deck = deck_with_leaf("contents", json!({
            "presentation":"shape:ring", "itemColumns":"auto",
            "items":[{"id":"item-a","title":"Updated title","text":"Edited after replacement"}]
        }));
        let slide = &mut deck["deck"]["slides"][0];
        slide["background"] = json!({"enabled":true,"src":"https://example.com/background.png","contentWidth":1});
        slide["layout"] = json!({"preset":"flow","contentsReplacement":{
            "version":1,"width":0.62,
            "context":{"src":"https://example.com/background.png","fit":"contain","position":"50% 50%","contentAlign":"center","contentVerticalAlign":"center","textSurface":"auto"},
            "entries":[{"id":slide["blocks"][0]["id"],"presentation":"cards:filled","columns":{"itemColumns":2,"itemLayout":"grid","columnPreference":2}}]
        }});
        let expected = slide.clone();
        let parsed = parsed_agent_deck_without_schema_validation(deck, 0).unwrap();
        assert_eq!(parsed.slides[0], expected);
        let reopened = parsed_agent_deck_without_schema_validation(
            serde_json::from_str(&parsed.canonical_json).unwrap(), 0,
        ).unwrap();
        assert_eq!(reopened.slides[0], expected);
        assert_eq!(reopened.slides[0]["layout"]["contentsReplacement"]["width"], 0.62);
        assert_eq!(reopened.slides[0]["layout"]["contentsReplacement"]["entries"][0]["columns"]["itemColumns"], 2);
        assert_eq!(reopened.slides[0]["blocks"][0]["props"]["items"][0]["text"], "Edited after replacement");
    }

    #[test]
    fn response_format_uses_the_shared_registered_theme_ids() {
        let format = response_format(expectations());
        assert_eq!(format["json_schema"]["schema"]["properties"]["deck"]["properties"]["theme"]["enum"], json!(registered_theme_ids()));
        for id in registered_theme_ids() {
            let mut deck = deck_with_leaf("text", json!({"text":"Theme storage"}));
            deck["deck"]["theme"] = json!(id);
            let saved = parse_and_validate_work_editor_deck(&deck.to_string(), expectations()).unwrap();
            assert_eq!(saved.theme, *id);
        }
    }

    #[test]
    fn text_panel_preserves_multiline_content_and_rejects_missing_text() {
        let deck = deck_with_leaf("text-panel", json!({"text":"第一段。\n\n第二段。"}));
        validate_authorable_deck_value(&deck, expectations()).unwrap();
        let saved = parse_and_validate_work_editor_deck(&deck.to_string(), expectations()).unwrap();
        assert_eq!(saved.slides[0]["blocks"][0]["props"], deck["deck"]["slides"][0]["blocks"][0]["props"]);
        for props in [json!({}), json!({"text":0})] {
            assert!(validate_authorable_deck_value(&deck_with_leaf("text-panel",props), expectations()).is_err());
        }
    }

    #[test]
    fn mind_map_preserves_nodes_and_rejects_broken_hierarchy() {
        let deck = deck_with_leaf("mind-map",json!({"content":{"items":[{"level":0,"title":"负责人","text":"统筹","icon":"User"},{"level":1,"title":"团队","text":"协作"},{"level":2,"title":"成员","text":"交付"}]}}));
        validate_authorable_deck_value(&deck,expectations()).unwrap();
        let saved=parse_and_validate_work_editor_deck(&deck.to_string(),expectations()).unwrap();
        assert_eq!(saved.slides[0]["blocks"][0]["props"],deck["deck"]["slides"][0]["blocks"][0]["props"]);
        let mut invalid=deck.clone();invalid["deck"]["slides"][0]["blocks"][0]["props"]["content"]["items"][1]["level"]=json!(3);
        assert!(validate_authorable_deck_value(&invalid,expectations()).is_err());
        invalid["deck"]["slides"][0]["blocks"][0]["props"]["content"]["items"][1]["level"]=json!(0);
        assert!(validate_authorable_deck_value(&invalid,expectations()).is_err());
    }

    #[test]
    fn diagrams_survive_authoring_and_work_editor_save() {
        for kind in ["concentric-circles", "layered-funnel", "folded-arrow", "wave-arrow", "layered-cube", "double-ring", "droplet-process"] {
            let count = match kind { "double-ring"=>6, "droplet-process"=>5, "wave-arrow"=>3, _=>4 };
            let items: Vec<Value> = (0..count).map(|i| {
                let mut item = json!({"title":format!("阶段{}",i+1),"text":"独立内容"});
                if kind == "double-ring" { item["side"] = json!(if i % 2 == 0 { "left" } else { "right" }); }
                if kind == "concentric-circles" { item["icon"] = json!("Database"); }
                item
            }).collect();
            let props = json!({"items":items});
            let deck = deck_with_leaf(kind, props);
            validate_authorable_deck_value(&deck, expectations()).unwrap();
            validation::validate_slide(&deck["deck"]["slides"][0]).unwrap();
            let saved = parse_and_validate_work_editor_deck(&deck.to_string(), expectations()).unwrap();
            assert_eq!(saved.slides[0]["blocks"][0]["type"], kind);
            assert_eq!(saved.slides[0]["blocks"][0]["props"], deck["deck"]["slides"][0]["blocks"][0]["props"]);
        }
    }

    #[test]
    fn funnel_3d_survives_authoring_and_work_editor_save() {
        let deck = deck_with_leaf("3d-funnel", json!({"items":[{"title":"引擎","text":"智能分析"},{"title":"存储","text":"数据管理"}]}));
        validate_authorable_deck_value(&deck, expectations()).unwrap();
        validation::validate_slide(&deck["deck"]["slides"][0]).unwrap();
        let saved = parse_and_validate_work_editor_deck(&deck.to_string(), expectations()).unwrap();
        assert_eq!(saved.slides[0]["blocks"][0]["type"], "3d-funnel");
        assert_eq!(saved.slides[0]["blocks"][0]["props"], deck["deck"]["slides"][0]["blocks"][0]["props"]);
    }

    #[test]
    fn drag_group_and_empty_media_survive_save_and_asset_validation() {
        let mut deck = deck_with_leaf("contents", json!({"presentation":"image-text","items":[{"id":"image-item","src":"","title":"Title","text":"Body"}]}));
        let child = deck["deck"]["slides"][0]["blocks"][0].clone();
        deck["deck"]["slides"][0]["blocks"] = json!([{"id":"drag-group","type":"layout-group","layout":{"variant":"columns","columns":2,"origin":"explicit","intent":"drag-compose"},"children":[child,{"id":"body","type":"text","props":{"text":"Body"}}]}]);
        let saved = parse_and_validate_work_editor_deck(&deck.to_string(), expectations()).unwrap();
        assert_eq!(saved.slides[0]["blocks"][0]["layout"]["intent"], "drag-compose");
        assert_eq!(saved.slides[0]["blocks"][0]["children"][0]["props"]["items"][0]["src"], "");
        assert_eq!(normalize_agent_image_sources(&mut deck, &[]).unwrap(), 0);
        validate_agent_image_sources_strict(&deck, &[]).unwrap();
        deck["deck"]["slides"][0]["blocks"][0]["children"][0]["props"]["items"][0]["src"] = json!("https://unknown.example/image.png");
        assert!(validate_agent_image_sources_strict(&deck, &[]).is_err());
    }

    #[test]
    fn background_alignment_survives_work_editor_and_authorable_validation() {
        for horizontal in ["left", "center", "right"] {
            for vertical in ["top", "center", "bottom"] {
                let mut deck = deck_with_leaf("text", json!({"text":"Body"}));
                let background = json!({"src":"https://example.com/background.png", "contentAlign":horizontal, "contentVerticalAlign":vertical});
                deck["deck"]["slides"][0]["background"] = background.clone();
                validate_authorable_deck_value(&deck, expectations()).unwrap();
                let parsed = parse_and_validate_work_editor_deck(&deck.to_string(), expectations()).unwrap();
                assert_eq!(parsed.slides[0]["background"], background);
            }
        }
        let mut deck = deck_with_leaf("text", json!({"text":"Body"}));
        deck["deck"]["slides"][0]["background"] = json!({"src":"https://example.com/background.png", "contentAlign":"invalid"});
        assert!(validate_authorable_deck_value(&deck, expectations()).is_err());
    }

    #[test]
    fn background_content_width_survives_authoring_and_work_editor_storage() {
        let format = response_format(expectations());
        let schema = &format["json_schema"]["schema"]["properties"]["deck"]["properties"]["slides"]["items"]["properties"]["background"];
        assert_eq!(schema["properties"]["contentWidth"], json!({"type":"number","minimum":0.2,"maximum":1}));
        assert!(schema.get("required").is_none());
        for width in [None, Some(0.2), Some(0.55), Some(1.0)] {
            let mut deck = deck_with_leaf("text", json!({"text":"Body stays unchanged"}));
            let mut background = json!({"src":"https://example.com/background.png","contentAlign":"left","overlay":false});
            if let Some(width) = width { background["contentWidth"] = json!(width); }
            deck["deck"]["slides"][0]["background"] = background.clone();
            validate_authorable_deck_value(&deck, expectations()).unwrap();
            validation::validate_slide(&deck["deck"]["slides"][0]).unwrap();
            let authored = parse_and_validate_deck(&deck.to_string(), expectations()).unwrap();
            assert_eq!(authored.slides[0]["background"], background);
            let saved = parse_and_validate_work_editor_deck(&deck.to_string(), expectations()).unwrap();
            assert_eq!(saved.slides[0]["background"], background);
            assert_eq!(saved.slides[0]["blocks"], deck["deck"]["slides"][0]["blocks"]);
            assert_eq!(serde_json::from_str::<Value>(&saved.canonical_json).unwrap()["deck"]["slides"][0]["background"], background);
            let restored: Value = serde_json::from_str(&saved.slides[0].to_string()).unwrap();
            assert_eq!(restored, saved.slides[0]);
            if width.is_none() { assert!(restored["background"].get("contentWidth").is_none()); }
        }
    }

    #[test]
    fn background_content_width_rejects_invalid_values_even_without_overlay() {
        for width in [json!(-1), json!(0), json!(0.199), json!(1.001), json!("0.5"), json!("NaN"), json!(true), json!({}), json!([]), Value::Null] {
            for overlay in [json!(false), json!({"opacity":0.1})] {
                let mut deck = deck_with_leaf("text", json!({"text":"Body"}));
                deck["deck"]["slides"][0]["background"] = json!({"src":"https://example.com/background.png","contentWidth":width,"overlay":overlay});
                assert!(validate_authorable_deck_value(&deck, expectations()).unwrap_err().contains("contentWidth"), "{width}");
                assert!(validation::validate_slide(&deck["deck"]["slides"][0]).is_err(), "{width}");
            }
        }
    }

    #[test]
    fn heading_variants_and_background_text_surfaces_survive_storage_without_defaults() {
        for variant in [None, Some("section"), Some("plain"), Some("display")] {
            for surface in [None, Some("auto"), Some("none")] {
                let mut props = json!({"text":"Title stays editable","level":2,"kicker":"Context"});
                if let Some(variant) = variant { props["variant"] = json!(variant); }
                let mut deck = deck_with_leaf("heading", props.clone());
                let mut background = json!({"src":"https://example.com/background.png","contentWidth":0.5,"overlay":false});
                if let Some(surface) = surface { background["textSurface"] = json!(surface); }
                deck["deck"]["slides"][0]["background"] = background.clone();
                validate_authorable_deck_value(&deck, expectations()).unwrap();
                validation::validate_slide(&deck["deck"]["slides"][0]).unwrap();
                for saved in [
                    parse_and_validate_deck(&deck.to_string(), expectations()).unwrap(),
                    parse_and_validate_work_editor_deck(&deck.to_string(), expectations()).unwrap(),
                ] {
                    assert_eq!(saved.slides[0]["blocks"][0]["props"], props);
                    assert_eq!(saved.slides[0]["background"], background);
                    let restored: Value = serde_json::from_str(&saved.canonical_json).unwrap();
                    assert_eq!(restored["deck"]["slides"][0]["blocks"][0]["props"], props);
                    assert_eq!(restored["deck"]["slides"][0]["background"], background);
                }
            }
        }
    }

    #[test]
    fn heading_variants_and_background_text_surfaces_reject_invalid_raw_values() {
        for value in [json!(""), json!("hero"), json!("PLAIN"), json!(false), json!(1), json!({}), json!([]), Value::Null] {
            let deck = deck_with_leaf("heading", json!({"text":"Title","variant":value}));
            assert!(validate_authorable_deck_value(&deck, expectations()).unwrap_err().contains("variant"), "{value}");
            assert!(validation::validate_slide(&deck["deck"]["slides"][0]).is_err(), "{value}");
        }
        for value in [json!(""), json!("transparent"), json!("NONE"), json!(false), json!(1), json!({}), json!([]), Value::Null] {
            for overlay in [json!(false), json!({"opacity":0.2})] {
                let mut deck = deck_with_leaf("text", json!({"text":"Body"}));
                deck["deck"]["slides"][0]["background"] = json!({"src":"https://example.com/background.png","textSurface":value,"overlay":overlay});
                assert!(validate_authorable_deck_value(&deck, expectations()).unwrap_err().contains("textSurface"), "{value}");
                assert!(validation::validate_slide(&deck["deck"]["slides"][0]).is_err(), "{value}");
            }
        }
        for kind in ["hero", "text", "text-panel"] {
            let props = if kind == "hero" { json!({"title":"Title","variant":"display"}) } else { json!({"text":"Body","variant":"display"}) };
            assert!(validate_authorable_deck_value(&deck_with_leaf(kind, props), expectations()).is_err(), "{kind}");
        }
    }

    #[test]
    fn design_options_response_schema_is_optional_and_component_specific() {
        let heading = doe_component::schema::component_props_response_schema("heading");
        assert_eq!(heading["properties"]["variant"], json!({"type":"string","enum":["section","plain","display"]}));
        assert_eq!(heading["required"], json!(["text"]));
        for kind in ["text", "text-panel", "quote", "notice"] {
            assert!(doe_component::schema::component_props_response_schema(kind)["properties"].get("variant").is_none(), "{kind}");
        }
        let format = response_format(expectations());
        let background = &format["json_schema"]["schema"]["properties"]["deck"]["properties"]["slides"]["items"]["properties"]["background"];
        assert_eq!(background["properties"]["textSurface"], json!({"type":"string","enum":["auto","none"]}));
        assert!(background.get("required").is_none());
    }

    #[test]
    fn retired_text_roles_are_accepted_and_omitted_from_canonical_decks() {
        for role in [json!("describe"), json!("content"), json!("title"), json!("emphasis"), json!("unknown"), Value::Null] {
            let input = deck_with_leaf("text", json!({"text":"正文 textRole 不改写", "textRole":role}));
            validate_authorable_deck_value(&input, expectations()).unwrap();
            validation::validate_slide(&input["deck"]["slides"][0]).unwrap();
            let parsed = parsed_deck_from_valid_value(input.clone(), 0).unwrap();
            assert_eq!(parsed.slides[0]["blocks"][0]["props"], json!({"text":"正文 textRole 不改写"}));
            assert!(input["deck"]["slides"][0]["blocks"][0]["props"].get("textRole").is_some());
        }
    }

    fn expectations() -> SlideDeckExpectations {
        SlideDeckExpectations::new(1).unwrap()
    }

    #[test]
    fn work_editor_preserves_selected_text_overrides() {
        let mut deck = deck_with_leaf("text", json!({"text":"Selected text"}));
        let formatting = json!([{"path":["text"],"text":"Selected text","runs":[{"start":0,"end":8,"size":"h1","bold":true,"italic":true,"underline":true,"strike":true,"color":"theme:primary"}]}]);
        deck["deck"]["slides"][0]["blocks"][0]["textOverrides"] = formatting.clone();
        let parsed = parse_and_validate_work_editor_deck(&deck.to_string(), expectations()).unwrap();
        assert_eq!(parsed.slides[0]["blocks"][0]["textOverrides"], formatting);
    }

    fn valid_deck() -> Value {
        json!({
            "version": 4,
            "pageNumber": {"enabled": true, "format": "number"},
            "deck": {
                "title": "Structured output",
                "theme": "yrkie-theme",
                "slides": [{
                    "id": "slide-01",
                    "size": {"width": 960, "height": 540, "unit": "pt"},
                    "blocks": [{
                        "id": "heading-1",
                        "type": "heading",
                        "props": {"text": "Reliable Slide Agent"}
                    }]
                }]
            }
        })
    }

    fn deck_with_leaf(component_type: &str, props: Value) -> Value {
        let mut deck = valid_deck();
        deck["deck"]["slides"][0]["blocks"][0] = json!({
            "id": "component-under-test",
            "type": component_type,
            "props": props
        });
        deck
    }

    #[test]
    fn generated_image_role_and_ratio_must_match_edge_media_axis() {
        let source = format!("yrkie-asset-data://{}", "a".repeat(64));
        let edge_slide = |position: &str| {
            json!({
                "blocks": [{
                    "id": "edge-root",
                    "type": "layout-group",
                    "layout": {"variant": "edge-media", "mediaPosition": position},
                    "children": [
                        {"id": "content", "type": "layout-group", "layout": {"region": "content"}, "children": []},
                        {"id": "media", "type": "media", "layout": {"region": "media"}, "props": {"src": source, "alt": "scene"}}
                    ]
                }]
            })
        };
        let asset = |image_type, ratio: &str| {
            doe_core::asset::generated::OutlineGeneratedImageAsset {
                slide_reference: source.clone(),
                image_type,
                ratio: ratio.to_string(),
            }
        };

        let error = validate_generated_image_asset_placements(
            &[edge_slide("right")],
            &[asset(
                doe_core::asset::generated::GeneratedImageType::Decorative,
                "16:9",
            )],
        )
        .expect_err("landscape scene must not enter a vertical rail");
        assert!(error.starts_with(GENERATED_IMAGE_PLACEMENT_MISMATCH_ERROR));

        validate_generated_image_asset_placements(
            &[edge_slide("right")],
            &[asset(
                doe_core::asset::generated::GeneratedImageType::Decorative,
                "3:4",
            )],
        )
        .expect("portrait scene matches a vertical rail");
        validate_generated_image_asset_placements(
            &[edge_slide("bottom")],
            &[asset(
                doe_core::asset::generated::GeneratedImageType::Decorative,
                "16:9",
            )],
        )
        .expect("landscape scene matches a horizontal rail");

        let error = validate_generated_image_asset_placements(
            &[edge_slide("right")],
            &[asset(
                doe_core::asset::generated::GeneratedImageType::Content,
                "3:4",
            )],
        )
        .expect_err("transparent content must not become edge media");
        assert!(error.contains("transparent content image"));
    }

    #[test]
    fn generated_image_contract_covers_implicit_root_edge_media() {
        let source = format!("yrkie-asset-data://{}", "c".repeat(64));
        let implicit_slide = |media_first: bool, preset: &str| {
            let content = json!({
                "id": "content",
                "type": "layout-group",
                "layout": {"region": "content"},
                "children": []
            });
            let media = json!({
                "id": "media",
                "type": "media",
                "layout": {"region": "media"},
                "props": {"src": source, "alt": "scene"}
            });
            let blocks = if media_first {
                vec![media, content]
            } else {
                vec![content, media]
            };
            json!({
                "layout": {"preset": preset},
                "blocks": blocks
            })
        };
        let asset = |image_type, ratio: &str| {
            doe_core::asset::generated::OutlineGeneratedImageAsset {
                slide_reference: source.clone(),
                image_type,
                ratio: ratio.to_string(),
            }
        };

        for media_first in [true, false] {
            let error = validate_generated_image_asset_placements(
                &[implicit_slide(media_first, "edge-media")],
                &[asset(
                    doe_core::asset::generated::GeneratedImageType::Decorative,
                    "16:9",
                )],
            )
            .expect_err("a landscape image must be rejected from either vertical edge");
            assert!(error.starts_with(GENERATED_IMAGE_PLACEMENT_MISMATCH_ERROR));

            validate_generated_image_asset_placements(
                &[implicit_slide(media_first, "edge-media")],
                &[asset(
                    doe_core::asset::generated::GeneratedImageType::Decorative,
                    "3:4",
                )],
            )
            .expect("a portrait image may be used on either vertical edge");
        }

        let error = validate_generated_image_asset_placements(
            &[implicit_slide(false, "edge-media")],
            &[asset(
                doe_core::asset::generated::GeneratedImageType::Content,
                "3:4",
            )],
        )
        .expect_err("a transparent content image must not become implicit edge media");
        assert!(error.contains("transparent content image"));

        validate_generated_image_asset_placements(
            &[implicit_slide(false, "flow")],
            &[asset(
                doe_core::asset::generated::GeneratedImageType::Decorative,
                "16:9",
            )],
        )
        .expect("root region labels outside a bleed preset are not implicit edge media");
    }

    #[test]
    fn generated_slide_background_requires_a_landscape_decorative_scene() {
        let source = format!("yrkie-asset-data://{}", "b".repeat(64));
        let slide = json!({
            "background": {"src": source},
            "blocks": []
        });
        let asset = |image_type, ratio: &str| {
            doe_core::asset::generated::OutlineGeneratedImageAsset {
                slide_reference: source.clone(),
                image_type,
                ratio: ratio.to_string(),
            }
        };
        assert!(validate_generated_image_asset_placements(
            &[slide.clone()],
            &[asset(
                doe_core::asset::generated::GeneratedImageType::Decorative,
                "3:4"
            )],
        )
        .is_err());
        assert!(validate_generated_image_asset_placements(
            &[slide.clone()],
            &[asset(
                doe_core::asset::generated::GeneratedImageType::Content,
                "16:9"
            )],
        )
        .is_err());
        validate_generated_image_asset_placements(
            &[slide],
            &[asset(
                doe_core::asset::generated::GeneratedImageType::Decorative,
                "16:9",
            )],
        )
        .expect("landscape decorative scene is a valid background");
    }

    #[test]
    fn request_contract_removes_provider_structured_output_and_keeps_runtime_policy() {
        let mut other = Some(json!({
            "response_format": {"type": "text"},
            "responseFormat": {"type": "json_object"},
            "plugins": [{"id": "response-healing"}],
            "provider": {"require_parameters": true, "order": ["Google"]},
            "reasoning_effort": "high",
            "reasoningEffort": "high",
            "include_reasoning": true,
            "reasoning": {"effort": "high", "exclude": false}
        }));
        apply_request_contract(&mut other, true, Some(32_768)).unwrap();
        let other = other.unwrap();
        assert!(other.get("response_format").is_none());
        assert!(other.get("responseFormat").is_none());
        assert!(other["provider"].get("require_parameters").is_none());
        assert_eq!(other["provider"]["order"], json!(["Google"]));
        assert_eq!(other["provider"]["ignore"], json!(["parasail"]));
        assert_eq!(other["maxTokens"], 32_768);
        assert!(other.get("max_tokens").is_none());
        assert!(other.get("plugins").is_none());
        assert_eq!(
            other["reasoning"],
            json!({"max_tokens": VISIBLE_REASONING_MAX_TOKENS, "exclude": false})
        );
        assert!(other.get("reasoning_effort").is_none());
        assert!(other.get("reasoningEffort").is_none());
        assert!(other.get("include_reasoning").is_none());
        assert!(other.get("parallelToolCalls").is_none());
        assert!(other.get("parallel_tool_calls").is_none());
    }

    #[test]
    fn request_contract_without_openrouter_also_removes_structured_output() {
        let mut other = Some(json!({
            "plugins": [{"id": "untrusted"}],
            "response_format": {"type": "json_schema"},
            "maxTokens": 1_000_000,
            "max_tokens": 1_000_000
        }));
        apply_request_contract(&mut other, false, None).unwrap();
        let other = other.unwrap();
        assert!(other.get("plugins").is_none());
        assert!(other.get("response_format").is_none());
        assert_eq!(other["maxTokens"], DEFAULT_MAX_OUTPUT_TOKENS);
        assert!(other.get("max_tokens").is_none());
    }

    #[test]
    fn request_contract_requires_complete_group_structure() {
        let format = response_format(expectations());
        let schema = &format["json_schema"]["schema"];
        let slide = &schema["properties"]["deck"]["properties"]["slides"]["items"];
        let node = &slide["properties"]["blocks"]["items"];
        let leaf = &node["anyOf"][0];
        let group = &node["anyOf"][1];
        assert!(slide["properties"].get("editor").is_none());
        let component_variants = leaf["anyOf"].as_array().unwrap();
        assert_eq!(component_variants.len(), AUTHORABLE_COMPONENT_TYPES.len());
        let provider_types = component_variants
            .iter()
            .filter_map(|variant| variant["properties"]["type"]["enum"][0].as_str())
            .collect::<HashSet<_>>();
        assert_eq!(
            provider_types,
            AUTHORABLE_COMPONENT_TYPES.iter().copied().collect()
        );
        let legacy_only = COMPONENT_TYPES
            .iter()
            .copied()
            .filter(|component_type| !provider_types.contains(component_type))
            .collect::<Vec<_>>();
        assert!(legacy_only.is_empty());
        assert_eq!(
            component_variants[0]["required"],
            json!(["id", "type", "props"])
        );
        assert_eq!(group["properties"]["type"]["enum"], json!(["layout-group"]));
        assert_eq!(
            group["required"],
            json!(["id", "type", "layout", "children"])
        );
        assert_eq!(group["properties"]["children"]["minItems"], 1);
    }

    #[test]
    fn provider_schema_enforces_component_specific_required_fields() {
        let format = response_format(expectations());
        let variants = format["json_schema"]["schema"]["properties"]["deck"]["properties"]
            ["slides"]["items"]["properties"]["blocks"]["items"]["anyOf"][0]["anyOf"]
            .as_array()
            .unwrap();
        let variant = |component_type: &str| {
            variants
                .iter()
                .find(|variant| variant["properties"]["type"]["enum"] == json!([component_type]))
                .unwrap()
        };

        assert_eq!(
            variant("stat")["properties"]["props"]["required"],
            json!(["value"])
        );
        let numbered_items = &variant("numbered-icon-cards")["properties"]["props"]["properties"]
            ["content"]["properties"]["items"];
        assert_eq!(numbered_items["minItems"], 2);
        assert_eq!(numbered_items["maxItems"], 6);
        assert_eq!(
            numbered_items["items"]["required"],
            json!(["title", "text", "icon"])
        );
        assert_eq!(
            variant("waterfall-chart")["properties"]["props"]["properties"]["content"]
                ["properties"]["items"]["minItems"],
            2
        );
        assert_eq!(
            variant("donut-chart")["properties"]["props"]["properties"]["content"]["properties"]
                ["items"]["items"]["properties"]["value"]["minimum"],
            0
        );
        let risk_item = &variant("risk-matrix")["properties"]["props"]["properties"]["content"]
            ["properties"]["items"]["items"];
        assert_eq!(risk_item["properties"]["x"]["minimum"], 0);
        assert_eq!(risk_item["properties"]["x"]["maximum"], 1);
        assert_eq!(risk_item["properties"]["y"]["minimum"], 0);
        assert_eq!(risk_item["properties"]["y"]["maximum"], 1);
        let radar_axis = &variant("radar-chart")["properties"]["props"]["properties"]["content"]
            ["properties"]["axes"]["items"];
        assert_eq!(radar_axis["required"], json!(["label", "max"]));
        assert_eq!(radar_axis["properties"]["max"]["exclusiveMinimum"], 0);
        for component_type in ["grouped-bar-chart", "stacked-bar-chart"] {
            let data = &variant(component_type)["properties"]["props"]["properties"]["content"]
                ["properties"]["series"]["items"]["properties"]["data"];
            assert_eq!(data["items"]["minimum"], 0);
        }
        let line_data = &variant("line-chart")["properties"]["props"]["properties"]["content"]
            ["properties"]["series"]["items"]["properties"]["data"];
        assert!(line_data["items"].get("minimum").is_none());
        assert!(!variants.iter().any(|entry| entry["properties"]["type"]["enum"] == json!(["process-step"])));
    }

    #[test]
    fn valid_deck_is_returned_as_canonical_json() {
        let raw = serde_json::to_string_pretty(&valid_deck()).unwrap();
        let parsed = parse_and_validate_deck(&raw, expectations()).unwrap();
        let canonical = parsed.canonical_json;
        assert_eq!(
            serde_json::from_str::<Value>(&canonical).unwrap(),
            valid_deck()
        );
        assert_eq!(parsed.version, 4);
        assert_eq!(parsed.title, "Structured output");
        assert_eq!(parsed.slides.len(), 1);
        assert_eq!(parsed.page_number.format, SlidePageNumberFormat::Number);
        assert_eq!(parsed.image_source_repair_count, 0);
        assert!(!canonical.contains('\n'));
    }

    #[test]
    fn work_editor_save_accepts_renderer_compatible_runtime_content() {
        let mut deck = valid_deck();
        deck["deck"]["theme"] = json!("legacy-theme");
        deck["deck"]["slides"][0]["editor"] = json!({
            "selection": {"nodeId": "heading-1", "offset": 0}
        });
        deck["deck"]["slides"][0]["blocks"][0]["props"] = json!({
            "text": "",
            "editorState": {"caret": 0}
        });

        parse_and_validate_deck(&deck.to_string(), expectations())
            .expect_err("Agent author validation must remain strict");

        let parsed = parse_and_validate_work_editor_deck(&deck.to_string(), expectations())
            .expect("Work Editor must be able to save content its renderer accepts");
        let canonical = serde_json::from_str::<Value>(&parsed.canonical_json).unwrap();
        assert_eq!(canonical["deck"]["theme"], "yrkie-theme");
        assert_eq!(
            canonical["deck"]["slides"][0]["editor"]["selection"]["nodeId"],
            "heading-1"
        );
        assert_eq!(
            canonical["deck"]["slides"][0]["blocks"][0]["props"]["text"],
            ""
        );
    }

    #[test]
    fn work_editor_save_still_requires_a_valid_deck_and_slide_envelope() {
        let mut empty_blocks = valid_deck();
        empty_blocks["deck"]["slides"][0]["blocks"] = json!([]);
        let error = parse_and_validate_work_editor_deck(&empty_blocks.to_string(), expectations())
            .expect_err("an empty Slide cannot be stored");
        assert!(error.contains("blocks must not be empty"), "{error}");

        let mut invalid_size = valid_deck();
        invalid_size["deck"]["slides"][0]["size"]["width"] = json!(1280);
        let error = parse_and_validate_work_editor_deck(&invalid_size.to_string(), expectations())
            .expect_err("the Work canvas remains fixed");
        assert!(error.contains("960 x 540 pt"), "{error}");

        let mut duplicate_slides = valid_deck();
        let duplicate = duplicate_slides["deck"]["slides"][0].clone();
        duplicate_slides["deck"]["slides"] = json!([duplicate.clone(), duplicate]);
        let error = parse_and_validate_work_editor_deck(
            &duplicate_slides.to_string(),
            SlideDeckExpectations::new(2).unwrap(),
        )
        .expect_err("Slide ids remain unique");
        assert!(error.contains("unique within the Deck"), "{error}");
    }

    #[test]
    fn retired_components_are_not_readable_or_authorable() {
        for component_type in ["converging-arrows", "progress-list", "circular-process-2", "circular-process", "circular-process-4", "timeline-arrow", "supply-chain-flow", "chevron-list", "fishbone-diagram", "stair-step-chart"] {
            let deck = deck_with_leaf(component_type, json!({"content": {}}));
            assert!(validate_deck_value(&deck, expectations()).is_err(), "{component_type}");
            assert!(validate_authorable_deck_value(&deck, expectations()).is_err(), "{component_type}");
        }
    }



    #[test]
    fn explicit_columns_preserve_nested_content_through_author_validation() {
        for count in [2, 3, 4] {
            let mut value = valid_deck();
            let children = (0..count).map(|index| json!({
                "id":format!("column-{index}"), "type":"layout-group", "layout":{"variant":"stack"},
                "children":[{"id":format!("body-{index}"),"type":"text","props":{"text":"Column content"}}]
            })).collect::<Vec<_>>();
            value["deck"]["slides"][0]["blocks"] = json!([{
                "id":"columns", "type":"layout-group", "layout":{"variant":"columns","columns":count}, "children":children
            }]);
            validate_authorable_deck_value(&value, expectations()).expect("columns use the existing nested group and save contract");
            assert_eq!(normalize_agent_theme_managed_layout_fields(&mut value), 0);
            assert_eq!(value["deck"]["slides"][0]["blocks"][0]["layout"]["columns"], count);
        }
    }

    #[test]
    fn item_cards_preserve_variants_and_reject_invalid_items() {
        for variant in ["filled", "filled-icon", "outline", "side-rule", "top-rule", "top-icon", "connected", "connected-icon", "leaf", "quote", "bubble"] {
            let props = json!({"items":[{"title":"Goal", "text":"Plan", "icon":"Target"}], "variant":variant, "itemLayout":"grid", "itemColumns":3});
            validate_authorable_deck_value(&deck_with_leaf("item-cards", props), expectations()).expect("card variants use the shared save contract");
        }
        for props in [json!({"items":[]}), json!({"items":[{"title":"Title"}]}), json!({"items":[{"title":"Title","text":"Body","icon":3}]}), json!({"items":[{"title":"Title","text":"Body"}],"variant":"unknown"}), json!({"items":[{"title":"Title","text":"Body"}],"itemColumns":5})] {
            validate_authorable_deck_value(&deck_with_leaf("item-cards", props), expectations()).expect_err("reject invalid card content or layout");
        }
    }

    #[test]
    fn deleted_triangle_metrics_is_not_authorable() {
        let props = json!({"content":{"centerLabel":"Strategy","items":vec![json!({"label":"A","title":"Plan","description":"Define scope"});3]}});
        assert!(validate_authorable_deck_value(&deck_with_leaf("triangle-metrics", props), expectations()).is_err());
        assert!(!COMPONENT_TYPES.contains(&"triangle-metrics"));
        assert!(!AUTHORABLE_COMPONENT_TYPES.contains(&"triangle-metrics"));
    }

    #[test]
    fn base_media_requires_content_and_keeps_source_fields_strict() {
        for (kind, props) in [
            ("image-text", json!({"src":"https://example.com/image.png","alt":"Image","title":"Title","text":"Body"})),
            ("icon-text", json!({"icon":"Target","title":"Title","text":"Body"})),
        ] {
            validate_authorable_deck_value(&deck_with_leaf(kind, props.clone()), expectations()).unwrap();
            for field in ["title", "text", if kind == "image-text" { "src" } else { "icon" }] {
                let mut invalid = props.clone(); invalid[field] = json!("");
                assert!(validate_authorable_deck_value(&deck_with_leaf(kind, invalid), expectations()).is_err());
            }
            let mut invalid = props; invalid["items"] = json!([]);
            assert!(validate_authorable_deck_value(&deck_with_leaf(kind, invalid), expectations()).is_err());
        }
    }

    #[test]
    fn shape_contents_preserve_variants_and_enforce_geometry_counts() {
        for variant in ["semicircle", "petals", "cycle-arrows", "full-circle", "ring", "stairs", "pyramid"] {
            for count in [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13] {
                let items: Vec<Value> = (0..count).map(|_| json!({"title":"Title","text":"Body"})).collect();
                let props = json!({"variant":variant,"items":items});
                let max = match variant { "semicircle" | "cycle-arrows" | "full-circle" | "ring" => 6, "petals" => 8, _ => 12 };
                let valid = (2..=max).contains(&count);
                assert_eq!(validate_authorable_deck_value(&deck_with_leaf("shape-contents", props), expectations()).is_ok(), valid, "{variant}/{count}");
            }
        }
        let valid = json!({"variant":"petals","items":vec![json!({"title":"Title","text":"Body","icon":"Target"}); 3]});
        validate_authorable_deck_value(&deck_with_leaf("shape-contents", valid), expectations()).unwrap();
        let invalid = json!({"variant":"petals","items":vec![json!({"title":"Title","text":"Body","unknown":"Target"}); 3]});
        assert!(validate_authorable_deck_value(&deck_with_leaf("shape-contents", invalid), expectations()).is_err());
    }

    #[test]
    fn contents_cards_accept_one_to_four_columns_and_keep_legacy_reads() {
        for component_type in ["item-cards", "capability-cards", "numbered-icon-cards"] {
            let items = json!([{"title":"First", "text":"Body", "icon":"Target"}, {"title":"Second", "text":"Body", "icon":"Target"}]);
            let mut props = if component_type == "item-cards" { json!({"items":items}) } else { json!({"content":{"items":items}}) };
            for columns in [1, 2, 3, 4] {
                props["itemLayout"] = json!(if columns == 1 { "stack" } else { "grid" });
                props["itemColumns"] = json!(columns);
                validate_authorable_deck_value(&deck_with_leaf(component_type, props.clone()), expectations()).expect("Contents column menu");
            }
            props["itemColumns"] = json!(4);
            let deck = deck_with_leaf(component_type, props);
            validate_authorable_deck_value(&deck, expectations()).expect("four-column reflow is authorable");
            parse_and_validate_work_editor_deck(&deck.to_string(), expectations()).expect("existing documents remain readable");
        }
    }

    #[test]
    fn todo_items_require_text_and_boolean_state() {
        for item in [json!({"text":"Task"}), json!({"text":"Task","checked":"true"}), json!({"checked":true}), json!({"text":"Task","checked":false,"extra":1})] {
            validate_authorable_deck_value(
                &deck_with_leaf("todo-list", json!({"items":[item]})),
                expectations(),
            ).expect_err("todo text and state must follow the author contract");
        }
    }

    #[test]
    fn strict_authoring_accepts_every_documented_component_option() {
        let cases = vec![
            (
                "hero",
                json!({"title":"Title","eyebrow":"Context","subtitle":"Subtitle","icon":"Rocket","align":"center"}),
            ),
            (
                "heading",
                json!({"text":"Heading","level":2,"kicker":"Kicker"}),
            ),
            ("text", json!({"text":"Body"})),
            ("todo-list", json!({"items":[{"text":"First","checked":true},{"text":"Second","checked":false}],"itemLayout":"stack","itemColumns":1})),
            ("image-text", json!({"src":"https://example.com/image.png","alt":"Research","title":"Research","text":"Understand needs"})),
            ("icon-text", json!({"icon":"Target","title":"Goal","text":"Define scope"})),
            ("shape-contents", json!({"variant":"stairs","items":[{"title":"Plan","text":"Define"},{"title":"Deliver","text":"Review"}]})),
            ("item-cards", json!({"items":[{"title":"Title","text":"Body","icon":"Target"}],"variant":"filled-icon","itemLayout":"auto","itemColumns":3})),
            ("notice", json!({"text":"Notice","icon":"StickyNote"})),
            ("ordered-list", json!({"items":["First","Second"],"title":"Ordered list","itemLayout":"grid","itemColumns":2})),
            (
                "code-block",
                json!({"code":"select 1","language":"sql","wrap":false}),
            ),
            (
                "list",

                json!({"items":["A","B"],"title":"List","itemLayout":"grid","itemColumns":2}),
            ),
            (
                "question-card",
                json!({"title":"Question","index":1,"text":"Answer"}),
            ),
            (
                "stat",
                json!({"value":42,"label":"Revenue","description":"YoY"}),
            ),
            ("quote", json!({"text":"Quote","source":"Source"})),
            (
                "media",
                json!({
                    "src":"https://example.com/image.png","alt":"Diagram","format":"auto",
                    "fit":"contain","position":"50% 50%","aspectRatio":"4:3"
                }),
            ),
            (
                "table",
                json!({
                    "ariaLabel":"Comparison","borderStyle":"three-line","columnSizing":"adaptive",
                    "semanticWrap":{"locale":"zh-CN","protectedTerms":["Yrkie"]},
                    "content":{
                        "columns":[
                            {"header":"Metric","align":"left","locale":"en-US","protectedTerms":["ARR"]},
                            {"header":"Value","align":"right"}
                        ],
                        "rows":[{"cells":[{"text":"Revenue","emphasis":"highlight"},42]}]
                    }
                }),
            ),
            (
                "grouped-bar-chart",
                json!({
                    "subtitle":"USD","showLegend":true,
                    "content":{"categories":["2025"],"series":[{"name":"Revenue","data":[1]}],
                        "valuePrefix":"$","valueSuffix":"B","maxValue":2,"tickInterval":0.5}
                }),
            ),
            (
                "line-chart",
                json!({
                    "showLegend":true,"smooth":true,
                    "content":{"categories":["Q1","Q2"],"series":[{
                        "name":"Change","data":[-1,2],"labels":[{"index":1,"text":"Peak"}]
                    }],"valueSuffix":"%","includeZero":true,"minValue":-2,"maxValue":3,"tickInterval":1}
                }),
            ),
            (
                "stacked-bar-chart",
                json!({
                    "subtitle":"Mix","showLegend":false,
                    "content":{"categories":["A","B"],"series":[{"name":"Base","data":[1,2]}],
                        "showYAxis":true,"showValues":true,"legendReversed":false,
                        "annotation":{"label":"Window","from":0,"to":1}}
                }),
            ),
            (
                "risk-matrix",
                json!({
                    "subtitle":"Portfolio","content":{"xLabel":"Likelihood","yLabel":"Impact",
                        "items":[{"label":"Risk","x":0.2,"y":0.8}],
                        "priorityZone":{"x":0.5,"y":0.5,"width":0.5,"height":0.5,
                            "label":"Priority","labelLines":["Act now"]}}
                }),
            ),
            (
                "waterfall-chart",
                json!({
                    "subtitle":"Bridge","content":{"items":[
                        {"label":"Start","value":10,"type":"total","connectToNext":true,"showValue":true,"valuePosition":"inside"},
                        {"label":"End","value":12,"type":"total"}
                    ],"valuePrefix":"$","valueSuffix":"M","includeZero":true,"minValue":0,"maxValue":15,
                        "tickInterval":5,"showYAxis":true,"showValues":true,"showChangeSigns":true,
                        "staggerLabels":false,"footnote":"Source","callouts":[{"index":1,"text":"End","position":"above"}],
                        "comparisons":[{"from":0,"to":1,"label":"+2"}]}
                }),
            ),

            (
                "radar-chart",
                json!({
                    "subtitle":"Capabilities","showLegend":true,"content":{
                        "axes":[{"label":"A","max":5},{"label":"B","max":5},{"label":"C","max":5}],
                        "datasets":[{"name":"Now","values":[1,2,3]}]
                    }
                }),
            ),
            (
                "donut-chart",
                json!({"content":{
                    "items":[
                        {"label":"A","value":1,"percentLabel":"50%","badge":"Core","primary":true,"valueLabel":"1","detailLabel":"Detail"},
                        {"label":"B","value":1,"valueLabel":false}
                    ],"variant":"hero","showLegend":true,
                    "center":{"title":["Revenue","Mix"],"value":2,"eyebrow":"FY25","subtitle":"Total"},
                    "tag":"Mix","footerLines":["Source"],"footnotes":[{"align":"right","text":"Note","lines":["Line"]}],
                    "valuePrefix":"$","valueSuffix":"M","maximumFractionDigits":2
                }}),
            ),
            (
                "capability-cards",
                json!({"title":"Capabilities","itemLayout":"grid","itemColumns":3,
                "content":{"items":[{"title":"Plan","text":"Decide","icon":"strategy"}]}}),
            ),
            (
                "numbered-icon-cards",
                json!({"title":"Peers","itemLayout":"grid","itemColumns":3,
                "content":{"items":[
                    {"title":"A","text":"Alpha","icon":"star"},{"title":"B","text":"Beta","icon":"bolt"}
                ]}}),
            ),
            (
                "math-formula",
                json!({"content":{"formula":"x^2","display":true,"align":"center"}}),
            ),
        ];

        let mut cases = cases.to_vec();
        cases.push(("contents", json!({"presentation":"cards:connected","items":[{"id":"entry-1","title":"Title","text":"Body","icon":"Target"}],"itemLayout":"grid","itemColumns":3,"columnPreference":4})));
        let fixtures: Value = serde_json::from_str(include_str!("../../../../../../src/document/presentation/schema/authoring/schemas/doe-slide-v4.examples.json")).unwrap();
        fn find_props(value: &Value, kind: &str) -> Option<Value> {
            if value.get("type").and_then(Value::as_str) == Some(kind) {
                return value.get("props").cloned();
            }
            match value {
                Value::Array(values) => values.iter().find_map(|value| find_props(value, kind)),
                Value::Object(values) => values.values().find_map(|value| find_props(value, kind)),
                _ => None,
            }
        }
        for &kind in COMPONENT_TYPES {
            if !cases.iter().any(|(existing, _)| *existing == kind) {
                cases.push((kind, find_props(&fixtures, kind).unwrap_or_else(|| panic!("missing authoring fixture: {kind}"))));
            }
        }
        assert_eq!(cases.iter().map(|(kind, _)| *kind).collect::<HashSet<_>>(), COMPONENT_TYPES.iter().copied().collect());
        for (component_type, props) in cases {
            if !AUTHORABLE_COMPONENT_TYPES.contains(&component_type) {
                validate_deck_value(&deck_with_leaf(component_type, props), expectations())
                    .unwrap_or_else(|error| panic!("legacy {component_type}: {error}"));
                continue;
            }
            validate_authorable_deck_value(&deck_with_leaf(component_type, props), expectations())
                .unwrap_or_else(|error| panic!("{component_type}: {error}"));
        }
    }

    #[test]
    fn strict_authoring_rejects_unknown_keys_and_invalid_option_values() {
        let mut cases = Vec::<(Value, &str)>::new();

        let mut unknown_prop = valid_deck();
        unknown_prop["deck"]["slides"][0]["blocks"][0]["props"]["businessNote"] = json!("x");
        cases.push((unknown_prop, ".props.businessNote"));

        cases.push((
            deck_with_leaf("heading", json!({"text":"H","level":"huge"})),
            ".level",
        ));
        cases.push((
            deck_with_leaf("media", json!({"src":"x","alt":"x","fit":"bad"})),
            ".fit",
        ));
        cases.push((
            deck_with_leaf(
                "table",
                json!({"borderStyle":"rainbow","content":{
                    "columns":[{"header":"A"}],"rows":[{"cells":["B"]}]
                }}),
            ),
            ".borderStyle",
        ));
        cases.push((
            deck_with_leaf(
                "table",
                json!({"content":{
                    "columns":[{"header":"A"}],"rows":[{"cells":[{"emphasis":"muted"}]}]
                }}),
            ),
            ".cells[0].text",
        ));

        let mut invalid_slide_layout = valid_deck();
        invalid_slide_layout["deck"]["slides"][0]["layout"] = json!({"preset":"poster"});
        cases.push((invalid_slide_layout, ".layout.preset"));

        let mut invalid_leaf_layout = valid_deck();
        invalid_leaf_layout["deck"]["slides"][0]["blocks"][0]["layout"] = json!({"span":13});
        cases.push((invalid_leaf_layout, ".layout.span"));

        let mut invalid_group = valid_deck();
        invalid_group["deck"]["slides"][0]["blocks"] = json!([{
            "id":"group","type":"layout-group","layout":{"variant":7},
            "children":[{"id":"text","type":"text","props":{"text":"Body"}}]
        }]);
        cases.push((invalid_group, ".layout.variant"));

        let mut invalid_background = valid_deck();
        invalid_background["deck"]["slides"][0]["background"] = json!({});
        cases.push((invalid_background, ".background.src"));

        let mut editor = valid_deck();
        editor["deck"]["slides"][0]["editor"] = json!(true);
        cases.push((editor, ".editor"));

        for (deck, expected_path) in cases {
            let error = validate_authorable_deck_value(&deck, expectations())
                .expect_err("invalid authoring option must fail closed");
            assert!(error.contains(expected_path), "{expected_path}: {error}");
        }
    }

    #[test]
    fn strict_edge_media_requires_the_symmetric_root_contract() {
        let valid = || {
            let mut deck = valid_deck();
            deck["deck"]["slides"][0]["layout"] = json!({"preset":"edge-media"});
            deck["deck"]["slides"][0]["blocks"] = json!([{
                "id":"edge","type":"layout-group",
                "layout":{"variant":"edge-media","mediaPosition":"right","mediaRatio":0.36,"mediaShape":"fade","contentAlign":"center"},
                "children":[
                    {"id":"content","type":"text","layout":{"region":"content"},"props":{"text":"Body"}},
                    {"id":"media","type":"media","layout":{"region":"media"},
                        "props":{"src":"https://example.com/scene.png","alt":"Scene","aspectRatio":"3:4"}}
                ]
            }]);
            deck
        };
        validate_authorable_deck_value(&valid(), expectations())
            .expect("the exact edge-media root contract is authorable");

        let mut missing_preset = valid();
        missing_preset["deck"]["slides"][0]["layout"]["preset"] = json!("flow");

        let mut extra_root = valid();
        extra_root["deck"]["slides"][0]["blocks"]
            .as_array_mut()
            .unwrap()
            .push(json!({"id":"extra","type":"text","props":{"text":"Extra"}}));

        let mut wrong_children = valid();
        wrong_children["deck"]["slides"][0]["blocks"][0]["children"]
            .as_array_mut()
            .unwrap()
            .pop();

        let mut nested_edge = valid_deck();
        nested_edge["deck"]["slides"][0]["blocks"] = json!([{
            "id":"outer","type":"layout-group","layout":{"variant":"stack"},"children":[{
                "id":"inner","type":"layout-group","layout":{"variant":"edge-media"},"children":[
                    {"id":"content","type":"text","layout":{"region":"content"},"props":{"text":"Body"}},
                    {"id":"media","type":"media","layout":{"region":"media"},"props":{"src":"x","alt":"x"}}
                ]
            }]
        }]);

        let mut background = valid();
        background["deck"]["slides"][0]["background"] = json!({"src":"x"});

        let mut invalid_content_align = valid();
        invalid_content_align["deck"]["slides"][0]["blocks"][0]["layout"]["contentAlign"] =
            json!("stretch");

        for (deck, expected) in [
            (missing_preset, "must use the edge-media preset"),
            (extra_root, "exactly one root edge-media Group"),
            (wrong_children, "exactly two direct edge-media children"),
            (nested_edge, "must be a root Node"),
            (background, "cannot be combined with edge-media"),
            (invalid_content_align, ".contentAlign"),
        ] {
            let error = validate_authorable_deck_value(&deck, expectations())
                .expect_err("malformed edge-media output must fail closed");
            assert!(error.contains(expected), "{expected}: {error}");
        }
    }

    #[test]
    fn strict_chart_cross_fields_reject_invalid_axes_zones_and_indexes() {
        let mut cases = Vec::<(Value, &str)>::new();
        cases.push((
            deck_with_leaf(
                "line-chart",
                json!({"content":{
                    "categories":["Q1"],"series":[{"name":"S","data":[1]}],"tickInterval":0
                }}),
            ),
            ".tickInterval",
        ));
        cases.push((
            deck_with_leaf(
                "line-chart",
                json!({"content":{
                    "categories":["Q1"],"series":[{"name":"S","data":[1]}],"minValue":2,"maxValue":1
                }}),
            ),
            ".minValue",
        ));
        cases.push((
            deck_with_leaf(
                "line-chart",
                json!({"content":{
                    "categories":["Q1"],"series":[{"name":"S","data":[1],"labels":[{"index":1}]}]
                }}),
            ),
            ".labels[0].index",
        ));
        cases.push((
            deck_with_leaf(
                "stacked-bar-chart",
                json!({"content":{
                    "categories":["Q1"],"series":[{"name":"S","data":[1]}],
                    "annotation":{"label":"A","to":1}
                }}),
            ),
            ".annotation.to",
        ));
        cases.push((
            deck_with_leaf(
                "risk-matrix",
                json!({"content":{
                    "items":[{"label":"R","x":0.5,"y":0.5}],
                    "priorityZone":{"x":0.8,"y":0.8,"width":0.3,"height":0.3}
                }}),
            ),
            ".priorityZone",
        ));
        cases.push((
            deck_with_leaf(
                "waterfall-chart",
                json!({"content":{
                    "items":[{"label":"A","value":1},{"label":"B","value":2}],
                    "callouts":[{"index":2,"text":"Bad"}]
                }}),
            ),
            ".callouts[0].index",
        ));
        cases.push((
            deck_with_leaf(
                "waterfall-chart",
                json!({"content":{
                    "items":[{"label":"A","value":1},{"label":"B","value":2}],
                    "comparisons":[{"from":0,"to":2,"label":"Bad"}]
                }}),
            ),
            ".comparisons[0].to",
        ));

        for (deck, expected_path) in cases {
            validate_deck_value(&deck, expectations())
                .expect("legacy reader must retain the historical chart acceptance surface");
            let error = validate_authorable_deck_value(&deck, expectations())
                .expect_err("new Agent charts must satisfy cross-field constraints");
            assert!(error.contains(expected_path), "{expected_path}: {error}");
        }
    }

    #[test]
    fn strict_validation_rejects_theme_managed_styles_at_every_authoring_surface() {
        let mut props = valid_deck();
        props["deck"]["slides"][0]["blocks"][0]["props"]["fontSize"] = json!(28);

        let mut leaf_layout = valid_deck();
        leaf_layout["deck"]["slides"][0]["blocks"][0]["layout"] =
            json!({"span": "full", "fontFamily": "Arial"});

        let mut group_layout = valid_deck();
        group_layout["deck"]["slides"][0]["blocks"] = json!([{
            "id": "group-1",
            "type": "layout-group",
            "layout": {"variant": "stack", "borderRadius": 12},
            "children": [{
                "id": "heading-1",
                "type": "heading",
                "props": {"text": "Nested heading"}
            }]
        }]);

        let mut slide_layout = valid_deck();
        slide_layout["deck"]["slides"][0]["layout"] = json!({"preset": "flow", "padding": "24pt"});

        for (deck, expected_path) in [
            (props, "blocks[0].props.fontSize"),
            (leaf_layout, "blocks[0].layout.fontFamily"),
            (group_layout, "blocks[0].layout.borderRadius"),
            (slide_layout, "slides[0].layout.padding"),
        ] {
            let error = validate_deck_value(&deck, expectations())
                .expect_err("strict Agent output must reject theme-owned styles");
            assert!(error.contains(expected_path), "{error}");
            assert!(error.contains("theme-managed"), "{error}");
        }
    }

    #[test]
    fn compatibility_normalization_strips_theme_styles_but_preserves_semantics() {
        let mut deck = valid_deck();
        deck["deck"]["slides"][0]["layout"] = json!({"preset": "flow", "padding": "24pt"});
        deck["deck"]["slides"][0]["blocks"] = json!([{
            "id": "group-1",
            "type": "layout-group",
            "layout": {"variant": "stack", "borderRadius": 12},
            "children": [{
                "id": "heading-1",
                "type": "heading",
                "props": {
                    "text": "Nested heading",
                    "appearance": {"font_size": 28, "accentColor": "#fff"}
                },
                "layout": {"span": "full", "fontFamily": "Arial"}
            }]
        }]);

        let parsed = parse_and_validate_deck(&deck.to_string(), expectations())
            .expect("legacy style fields should be stripped before compatibility validation");
        let canonical = serde_json::from_str::<Value>(&parsed.canonical_json).unwrap();
        let slide = &canonical["deck"]["slides"][0];
        let group = &slide["blocks"][0];
        let leaf = &group["children"][0];
        assert_eq!(slide["layout"]["preset"], "flow");
        assert!(slide["layout"].get("padding").is_none());
        assert_eq!(group["layout"]["variant"], "stack");
        assert!(group["layout"].get("borderRadius").is_none());
        assert_eq!(leaf["layout"]["span"], "full");
        assert!(leaf["layout"].get("fontFamily").is_none());
        assert_eq!(leaf["props"]["text"], "Nested heading");
        assert!(leaf["props"]["appearance"].get("font_size").is_none());
        assert!(leaf["props"]["appearance"].get("accentColor").is_none());
    }

    #[test]
    fn waterfall_requires_at_least_two_items() {
        let one_item = deck_with_leaf(
            "waterfall-chart",
            json!({"content": {"items": [{"label": "Start", "value": 10}]}}),
        );
        validate_deck_value(&one_item, expectations())
            .expect("historical one-item waterfalls remain readable");
        let error = validate_authorable_deck_value(&one_item, expectations())
            .expect_err("a waterfall needs a start and at least one further item");
        assert!(error.contains("between 2 and 100 items"), "{error}");

        let two_items = deck_with_leaf(
            "waterfall-chart",
            json!({"content": {"items": [
                {"label": "Start", "value": 10},
                {"label": "End", "value": 12}
            ]}}),
        );
        validate_authorable_deck_value(&two_items, expectations())
            .expect("two waterfall items are valid");
    }

    #[test]
    fn donut_requires_non_negative_values_and_a_positive_total() {
        for (values, expected) in [
            (vec![-1.0, 2.0], "must be non-negative"),
            (vec![0.0, 0.0], "at least one positive value"),
        ] {
            let deck = deck_with_leaf(
                "donut-chart",
                json!({"content": {"items": [
                    {"label": "A", "value": values[0]},
                    {"label": "B", "value": values[1]}
                ]}}),
            );
            validate_deck_value(&deck, expectations())
                .expect("historical donut values remain readable");
            let error = validate_authorable_deck_value(&deck, expectations())
                .expect_err("invalid donut values must fail closed");
            assert!(error.contains(expected), "{error}");
        }

        let valid = deck_with_leaf(
            "donut-chart",
            json!({"content": {"items": [
                {"label": "A", "value": 0},
                {"label": "B", "value": 2}
            ]}}),
        );
        validate_authorable_deck_value(&valid, expectations())
            .expect("a positive donut total is valid");
    }

    #[test]
    fn risk_coordinates_must_be_normalized() {
        for (x, y, expected_path) in [(-0.01, 0.5, ".x"), (0.5, 1.01, ".y")] {
            let deck = deck_with_leaf(
                "risk-matrix",
                json!({"content": {"items": [{"label": "Risk", "x": x, "y": y}]}}),
            );
            validate_deck_value(&deck, expectations())
                .expect("historical unbounded risk coordinates remain readable");
            let error = validate_authorable_deck_value(&deck, expectations())
                .expect_err("risk coordinates outside the plot must fail closed");
            assert!(error.contains(expected_path), "{error}");
            assert!(error.contains("between 0 and 1"), "{error}");
        }

        let valid = deck_with_leaf(
            "risk-matrix",
            json!({"content": {"items": [{"label": "Risk", "x": 0, "y": 1}]}}),
        );
        validate_authorable_deck_value(&valid, expectations())
            .expect("risk plot boundaries are inclusive");
    }

    #[test]
    fn radar_axes_and_values_respect_declared_bounds() {
        let valid_props = json!({"content": {
            "axes": [
                {"label": "A", "max": 1},
                {"label": "B", "max": 5},
                {"label": "C", "max": 10}
            ],
            "datasets": [{"name": "Now", "values": [0, 5, 10]}]
        }});
        validate_authorable_deck_value(
            &deck_with_leaf("radar-chart", valid_props.clone()),
            expectations(),
        )
        .expect("radar boundaries are inclusive");

        for (path, value, expected) in [
            ("/content/axes/0/label", json!(""), ".axes[0].label"),
            ("/content/axes/0/max", json!(0), ".axes[0].max"),
            ("/content/datasets/0/values/0", json!(-0.01), ".values[0]"),
            ("/content/datasets/0/values/1", json!(5.01), ".values[1]"),
        ] {
            let mut props = valid_props.clone();
            *props.pointer_mut(path).expect("valid radar test path") = value;
            let deck = deck_with_leaf("radar-chart", props);
            validate_deck_value(&deck, expectations())
                .expect("historical radar ranges remain readable");
            let error = validate_authorable_deck_value(&deck, expectations())
                .expect_err("invalid radar geometry must fail closed");
            assert!(error.contains(expected), "{error}");
        }
    }

    #[test]
    fn bar_charts_reject_negative_data_while_line_chart_accepts_it() {
        let props = json!({"content": {
            "categories": ["Q1"],
            "series": [{"name": "Change", "data": [-1]}]
        }});
        for component_type in ["grouped-bar-chart", "stacked-bar-chart"] {
            let deck = deck_with_leaf(component_type, props.clone());
            validate_deck_value(&deck, expectations())
                .expect("historical signed bar data remains readable");
            let error = validate_authorable_deck_value(&deck, expectations())
                .expect_err("bar magnitudes must be non-negative");
            assert!(error.contains("must be non-negative"), "{error}");
        }
        validate_authorable_deck_value(&deck_with_leaf("line-chart", props), expectations())
            .expect("line charts may represent signed change");
    }

    #[test]
    fn agent_deck_repairs_the_four_observed_asset_reference_copy_errors() {
        let allowed = vec![
            "yrkie-asset-data://e66b99bda51e4322be034cbd24a6bbc6a7538ebf964e899d9c7045c55be1abcb"
                .to_string(),
            "yrkie-asset-data://f0250caa7b349cbc66fe8c31fd02530bb0144acca2d81105eeaadf5f0157fb6f"
                .to_string(),
            "yrkie-asset-data://53378b93fd05d76cda3688063d3105379ebab2fa07c45e817b04df118e74e357"
                .to_string(),
            "yrkie-asset-data://9ed79858695d9aa04d35c43849916c96b701d6dabdaebae0d61211993f805dc7"
                .to_string(),
        ];
        let mut deck = valid_deck();
        deck["deck"]["slides"][0]["background"] = json!({
            "src": "yrkie-asset-data://e66b99bda51e4322be034cbd24a6bbc6a7538ebf964e899d9c7045c55be1eabcb"
        });
        deck["deck"]["slides"][0]["blocks"]
            .as_array_mut()
            .unwrap()
            .extend([
                json!({
                    "id": "asset-second",
                    "type": "media",
                    "props": {
                        "src": "yrkie-asset-data://f0250caa7b349cbc66fe8c31fd02530bb0144acca2d81105eeaadf5f0177fb6f",
                        "alt": "Second asset"
                    }
                }),
                json!({
                    "id": "asset-third",
                    "type": "media",
                    "props": {
                        "src": "yrkie-asset-data://53378b93fd05d76cda3688063d3105379ebab2fa07c45e817b04df118e4e357",
                        "alt": "Third asset"
                    }
                }),
                json!({
                    "id": "asset-fourth",
                    "type": "media",
                    "props": {
                        "src": "yrkie-asset-data://9ed79858695d9aa04d35c43849916c96b701d6dabdaeb2e0d61211993f805dc7",
                        "alt": "Fourth asset"
                    }
                }),
            ]);

        let parsed = parse_and_validate_agent_deck(&deck.to_string(), expectations(), &allowed)
            .expect("uniquely repairable references");
        let canonical = serde_json::from_str::<Value>(&parsed.canonical_json).unwrap();

        assert_eq!(parsed.image_source_repair_count, 4);
        let mut repaired = collect_stable_asset_references(&canonical);
        let mut expected = allowed;
        repaired.sort();
        expected.sort();
        assert_eq!(repaired, expected);
    }

    #[test]
    fn agent_deck_repairs_the_observed_four_character_asset_reference_insertion() {
        let correct =
            "yrkie-asset-data://fd78ce073bc27d324b8b3783fdb5148e6d987ab52cc6873d35299f2251649dbb";
        let mut deck = valid_deck();
        deck["deck"]["slides"][0]["background"] = json!({
            "src": "yrkie-asset-data://fd78aa0ce073bc27d324b8b3783fdb514a8e6d987ab52cc6873d35299f2251649dbb"
        });

        let parsed = parse_and_validate_agent_deck(
            &deck.to_string(),
            expectations(),
            &[correct.to_string()],
        )
        .expect("the unique confirmed Outline asset must be restored");
        let canonical = serde_json::from_str::<Value>(&parsed.canonical_json).unwrap();

        assert_eq!(parsed.image_source_repair_count, 1);
        assert_eq!(canonical["deck"]["slides"][0]["background"]["src"], correct);
    }

    #[test]
    fn agent_deck_repairs_the_observed_asset_protocol_and_prefix_damage() {
        let correct =
            "yrkie-asset-data://63fcf3f6d99cc5a81dac438914ed82b76202c21a89a6b878ce489a374ae5723b";
        let mut deck = valid_deck();
        deck["deck"]["slides"][0]["blocks"]
            .as_array_mut()
            .unwrap()
            .push(json!({
                "id": "strategy-image",
                "type": "media",
                "props": {
                    "src": "yrkie-asset-media://063fcf3f6d99cc5a81dac438914ed82b76202c21a89a6b878ce489a374ae5723b",
                    "alt": "电商全域经营战略图标"
                }
            }));

        let parsed = parse_and_validate_agent_deck(
            &deck.to_string(),
            expectations(),
            &[correct.to_string()],
        )
        .expect("the unique confirmed Outline source must be restored");
        let canonical = serde_json::from_str::<Value>(&parsed.canonical_json).unwrap();

        assert_eq!(parsed.image_source_repair_count, 1);
        assert_eq!(
            canonical["deck"]["slides"][0]["blocks"][1]["props"]["src"],
            correct
        );
    }

    #[test]
    fn agent_deck_validates_and_repairs_all_image_src_values() {
        let correct = "https://images.example.com/annual-report/strategy.png";
        let mut deck = valid_deck();
        deck["deck"]["slides"][0]["blocks"]
            .as_array_mut()
            .unwrap()
            .push(json!({
                "id": "direct-image",
                "type": "media",
                "props": {
                    "src": "https://images.example.com/annual-report/strategx.png",
                    "alt": "Strategy"
                }
            }));

        let parsed = parse_and_validate_agent_deck(
            &deck.to_string(),
            expectations(),
            &[correct.to_string()],
        )
        .expect("a uniquely damaged direct image URL must be restored");
        let canonical = serde_json::from_str::<Value>(&parsed.canonical_json).unwrap();
        assert_eq!(parsed.image_source_repair_count, 1);
        assert_eq!(
            canonical["deck"]["slides"][0]["blocks"][1]["props"]["src"],
            correct
        );

        let mut unknown = valid_deck();
        unknown["deck"]["slides"][0]["blocks"]
            .as_array_mut()
            .unwrap()
            .push(json!({
                "id": "unknown-image",
                "type": "media",
                "props": {
                    "src": "https://untrusted.example.net/unrelated.png",
                    "alt": "Unknown"
                }
            }));
        let error = parse_and_validate_agent_deck(
            &unknown.to_string(),
            expectations(),
            &[correct.to_string()],
        )
        .expect_err("an image outside the authoritative manifest must fail closed");
        assert!(error.starts_with(ASSET_REFERENCE_MISMATCH_ERROR));
    }

    #[test]
    fn outline_image_source_collection_includes_managed_and_direct_images() {
        let managed =
            "yrkie-asset-data://63fcf3f6d99cc5a81dac438914ed82b76202c21a89a6b878ce489a374ae5723b";
        let direct = "https://images.example.com/annual-report/cover.png";
        let outline = json!({
            "slides": [{
                "contents": {
                    "cover": {
                        "body": {"type": "image", "src": direct, "ratio": "16:9", "role": "cover"},
                        "describe": "Cover"
                    },
                    "strategy": {
                        "body": {"type": "generated_image", "src": managed, "ratio": "1:1", "role": "icon"},
                        "describe": "Strategy"
                    }
                }
            }]
        });

        assert_eq!(
            collect_outline_image_sources(&outline),
            vec![direct.to_string(), managed.to_string()]
        );
    }

    #[test]
    fn agent_deck_rejects_unknown_and_ambiguous_asset_references() {
        let allowed = vec![format!("yrkie-asset-data://{}b", "a".repeat(63))];
        let mut unknown = valid_deck();
        unknown["deck"]["slides"][0]["background"] =
            json!({"src": format!("yrkie-asset-data://{}", "f".repeat(64))});
        let error = parse_and_validate_agent_deck(&unknown.to_string(), expectations(), &allowed)
            .expect_err("unknown references must fail closed");
        assert!(error.starts_with(ASSET_REFERENCE_MISMATCH_ERROR));

        let ambiguous_allowed = vec![
            format!("yrkie-asset-data://{}b", "a".repeat(63)),
            format!("yrkie-asset-data://{}c", "a".repeat(63)),
        ];
        let mut ambiguous = valid_deck();
        ambiguous["deck"]["slides"][0]["background"] =
            json!({"src": format!("yrkie-asset-data://{}d", "a".repeat(63))});
        let error = parse_and_validate_agent_deck(
            &ambiguous.to_string(),
            expectations(),
            &ambiguous_allowed,
        )
        .expect_err("ambiguous references must fail closed");
        assert!(error.starts_with(ASSET_REFERENCE_MISMATCH_ERROR));
    }

    #[test]
    fn page_number_is_defaulted_and_canonicalized() {
        for mutate in ["missing", "null", "enabled", "format", "unknown"] {
            let mut value = valid_deck();
            match mutate {
                "missing" => {
                    value.as_object_mut().unwrap().remove("pageNumber");
                }
                "null" => value["pageNumber"] = Value::Null,
                "enabled" => value["pageNumber"]["enabled"] = json!("true"),
                "format" => value["pageNumber"]["format"] = json!("roman"),
                "unknown" => value["pageNumber"]["position"] = json!("bottom"),
                _ => unreachable!(),
            }
            let parsed = parse_and_validate(&value.to_string(), expectations())
                .unwrap_or_else(|error| panic!("{mutate}: {error}"));
            let canonical: Value = serde_json::from_str(&parsed).unwrap();
            assert_eq!(
                canonical["pageNumber"],
                json!({"enabled": true, "format": "number"})
            );
        }

        let mut explicit = valid_deck();
        explicit["pageNumber"] = json!({"enabled": false, "format": "fraction"});
        let parsed = parse_and_validate(&explicit.to_string(), expectations()).unwrap();
        let canonical: Value = serde_json::from_str(&parsed).unwrap();
        assert_eq!(
            canonical["pageNumber"],
            json!({"enabled": false, "format": "fraction"})
        );
    }

    #[test]
    fn prose_markdown_and_trailing_text_fail_closed() {
        for raw in [
            "Here is the deck: {}",
            "```json\n{}\n```",
            "{} trailing text",
            "   ",
        ] {
            assert!(parse_and_validate(raw, expectations()).is_err(), "{raw}");
        }
    }

    #[test]
    fn a_single_unambiguous_missing_object_delimiter_is_repaired_before_validation() {
        let raw = valid_deck().to_string();
        let malformed = raw.replacen(
            "\"props\":{\"text\":\"Reliable Slide Agent\"}}]",
            "\"props\":{\"text\":\"Reliable Slide Agent\"}]",
            1,
        );
        assert_ne!(raw, malformed);
        let canonical = parse_and_validate(&malformed, expectations()).unwrap();
        assert_eq!(
            serde_json::from_str::<Value>(&canonical).unwrap(),
            valid_deck()
        );
    }

    #[test]
    fn a_missing_structural_key_opening_quote_is_repaired_before_validation() {
        let raw = valid_deck().to_string();
        let malformed = raw.replacen(r#""blocks":"#, r#"blocks":"#, 1);
        assert_ne!(raw, malformed);
        let canonical = parse_and_validate(&malformed, expectations()).unwrap();
        assert_eq!(
            serde_json::from_str::<Value>(&canonical).unwrap(),
            valid_deck()
        );
    }

    #[test]
    fn key_quote_repair_is_bounded_to_known_object_keys() {
        let raw = valid_deck().to_string();
        let unknown = raw.replacen(r#""blocks":"#, r#"unknown":"#, 1);
        assert!(parse_and_validate(&unknown, expectations()).is_err());

        let mut string_content = valid_deck();
        string_content["deck"]["slides"][0]["blocks"][0]["props"]["text"] =
            json!(r#"Reliable children":[not a structural key"#);
        let canonical = parse_and_validate(&string_content.to_string(), expectations()).unwrap();
        assert_eq!(
            serde_json::from_str::<Value>(&canonical).unwrap(),
            string_content
        );
    }

    #[test]
    fn delimiter_repair_remains_bounded_and_never_repairs_strings_or_prose() {
        for malformed in [
            "{\"version\":4,\"deck\":\"unterminated}",
            "prefix {\"version\":4}",
            "{[[[[[{",
        ] {
            let error = parse_and_validate(malformed, expectations()).unwrap_err();
            assert!(error.starts_with(INVALID_JSON_ERROR), "{error}");
        }
    }

    #[test]
    fn exact_version_canvas_count_and_ids_are_enforced() {
        for mutate in ["version", "canvas", "count", "duplicate"] {
            let mut value = valid_deck();
            match mutate {
                "version" => value["version"] = json!(5),
                "canvas" => value["deck"]["slides"][0]["size"]["width"] = json!(1920),
                "count" => value["deck"]["slides"] = json!([]),
                "duplicate" => {
                    value["deck"]["slides"][0]["blocks"] = json!([
                        {"id":"same","type":"heading","props":{"text":"One"}},
                        {"id":"same","type":"text","props":{"text":"Two"}}
                    ])
                }
                _ => unreachable!(),
            }
            assert!(
                parse_and_validate(&value.to_string(), expectations()).is_err(),
                "{mutate}"
            );
        }
    }

    #[test]
    fn only_the_redundant_fixed_deck_canvas_is_normalized() {
        let mut redundant = valid_deck();
        redundant["deck"]["size"] = json!({"width": 960, "height": 540, "unit": "pt"});
        let canonical = parse_and_validate(&redundant.to_string(), expectations()).unwrap();
        let canonical = serde_json::from_str::<Value>(&canonical).unwrap();
        assert!(canonical["deck"].get("size").is_none());

        let mut conflicting = valid_deck();
        conflicting["deck"]["size"] = json!({"width": 1920, "height": 1080, "unit": "pt"});
        let error = parse_and_validate(&conflicting.to_string(), expectations()).unwrap_err();
        assert!(error.contains("root.deck.size is not allowed"));
    }

    #[test]
    fn agent_boundary_discards_misplaced_leaf_slot_space_after_legacy_normalization() {
        let mut value = valid_deck();
        value["deck"]["slides"][0]["blocks"][0]["layout"] = json!({"span": "full"});
        value["deck"]["slides"][0]["blocks"][0]["slotSpace"] =
            json!({"top": 0, "right": 0, "bottom": "12pt", "left": 0});

        let canonical = parse_and_validate(&value.to_string(), expectations()).unwrap();
        let canonical = serde_json::from_str::<Value>(&canonical).unwrap();
        let block = &canonical["deck"]["slides"][0]["blocks"][0];
        assert!(block.get("slotSpace").is_none());
        assert_eq!(block["layout"]["span"], "full");
        assert!(block["layout"].get("slotSpace").is_none());
    }

    #[test]
    fn agent_boundary_discards_nested_leaf_slot_space_after_legacy_normalization() {
        let mut value = valid_deck();
        value["deck"]["slides"][0]["blocks"] = json!([{
            "id": "group-1",
            "type": "layout-group",
            "kind": "container",
            "layout": {"variant": "stack"},
            "children": [{
                "id": "heading-1",
                "type": "heading",
                "props": {"text": "Nested heading"},
                "slotSpace": {"bottom": "6pt"}
            }]
        }]);

        let canonical = parse_and_validate(&value.to_string(), expectations()).unwrap();
        let canonical = serde_json::from_str::<Value>(&canonical).unwrap();
        let child = &canonical["deck"]["slides"][0]["blocks"][0]["children"][0];
        assert!(child.get("slotSpace").is_none());
        assert!(child.get("layout").is_none());
    }

    #[test]
    fn slot_space_normalization_never_overwrites_a_layout_conflict() {
        let mut value = valid_deck();
        value["deck"]["slides"][0]["blocks"][0]["layout"] = json!({"slotSpace": {"bottom": "6pt"}});
        value["deck"]["slides"][0]["blocks"][0]["slotSpace"] = json!({"bottom": "12pt"});

        let error = parse_and_validate(&value.to_string(), expectations()).unwrap_err();
        assert!(error.contains("blocks[0].slotSpace is not allowed"));
    }

    #[test]
    fn component_collection_items_must_be_objects() {
        let mut value = valid_deck();
        value["deck"]["slides"][0]["blocks"][0] = json!({
            "id": "capability-1",
            "type": "capability-cards",
            "props": {"content": {"items": ["{\"title\":\"Wrong\",\"text\":\"string\"}"]}}
        });
        let error = parse_and_validate(&value.to_string(), expectations()).unwrap_err();
        assert!(error.starts_with(SCHEMA_MISMATCH_ERROR));
    }

    #[test]
    fn numbered_icon_cards_rejects_an_out_of_contract_agenda() {
        let mut value = valid_deck();
        value["deck"]["slides"][0]["blocks"][0] = json!({
            "id": "agenda",
            "type": "numbered-icon-cards",
            "props": {
                "content": {
                    "items": (1..=7)
                        .map(|index| json!({
                            "title": format!("Section {index}"),
                            "detail": format!("Agenda section {index}"),
                            "number": format!("{index:02}")
                        }))
                        .collect::<Vec<_>>()
                }
            }
        });

        let error = parse_and_validate(&value.to_string(), expectations()).unwrap_err();
        assert!(error.contains("must contain between 2 and 6 items"));
    }

    #[test]
    fn streamed_content_accounting_counts_only_text_deltas() {
        assert_eq!(
            streamed_content_bytes(&json!({
                "choices": [
                    {"delta": {"content": "你好"}},
                    {"delta": {"content": "abc"}},
                    {"delta": {"reasoning": "private"}}
                ]
            })),
            9
        );
    }

    #[test]
    fn validates_external_slide_deck_sample_when_configured() {
        let raw = if let Ok(raw) = std::env::var("YRKIE_SLIDE_V4_SAMPLE_JSON") {
            raw
        } else {
            let Ok(path) = std::env::var("YRKIE_SLIDE_V4_SAMPLE") else {
                return;
            };
            std::fs::read_to_string(path).expect("read external Slide v4 sample")
        };
        let value = parse_json_with_bounded_delimiter_repair(&raw)
            .expect("sample must be valid or deterministically repairable JSON");
        let slide_count = value["deck"]["slides"]
            .as_array()
            .expect("sample slides")
            .len();
        let expectations = SlideDeckExpectations::new(slide_count).expect("sample slide count");
        let parsed = match std::env::var("YRKIE_SLIDE_V4_ALLOWED_ASSET_REFERENCES_JSON") {
            Ok(references) => {
                let references = serde_json::from_str::<Vec<String>>(&references)
                    .expect("parse external allowed asset references");
                parse_and_validate_agent_deck(&raw, expectations, &references)
            }
            Err(_) => parse_and_validate_deck(&raw, expectations),
        }
        .expect("sample must satisfy the production Slide contract");
        assert_eq!(parsed.slides.len(), slide_count);
    }
