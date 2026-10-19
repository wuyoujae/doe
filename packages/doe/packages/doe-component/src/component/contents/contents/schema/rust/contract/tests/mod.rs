
    use super::*;
    fn props(count: usize, presentation: &str) -> Value {
        json!({"presentation":presentation,"itemLayout":"auto","itemColumns":"auto","columnPreference":4,"items":(0..count).map(|i| json!({"id":format!("item-{i}"),"title":"Title","text":"Body","icon":"Target"})).collect::<Vec<_>>()})
    }
    #[test]
    fn explicit_empty_media_is_a_replaceable_slot_not_missing_content() {
        for (presentation, field) in [("image-text", "src"), ("icon-horizontal", "icon"), ("capability", "icon"), ("numbered", "icon")] {
            let mut value = props(2, presentation);
            for item in value["items"].as_array_mut().unwrap() { item[field] = json!(""); }
            assert!(validate(value.as_object().unwrap(), "p").is_ok(), "{presentation}");
            value["items"][0].as_object_mut().unwrap().remove(field);
            assert!(validate(value.as_object().unwrap(), "p").is_err(), "Missing required slot must still be rejected");
        }
    }
    #[test]
    fn validates_all_presentations_and_counts() {
        for name in PRESENTATIONS {
            for count in [1, 2, 3, 4, 5, 6, 7, 8, 9, 12] {
                let mut p = props(count, name);
                if *name == "metrics" {
                    for item in p["items"].as_array_mut().unwrap() {
                        item.as_object_mut().unwrap().remove("icon");
                        item["label"] = json!("Metric");
                    }
                }
                if *name == "image-text" {
                    for item in p["items"].as_array_mut().unwrap() { item["src"] = json!("yrkie-asset-data://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"); }
                }
                if *name == "quotation" {
                    for item in p["items"].as_array_mut().unwrap() {
                        item.as_object_mut().unwrap().remove("title");
                        item["source"] = json!("Author");
                    }
                }
                let expected = match *name {
                    "shape:semicircle" | "shape:cycle-arrows" | "shape:full-circle" | "shape:ring" => (2..=6).contains(&count),
                    "shape:petals" => (2..=8).contains(&count),
                    "shape:stairs" | "shape:pyramid" | "shape:inverted-pyramid" => count >= 2,
                    "numbered" => (2..=6).contains(&count),
                    _ => true,
                };
                assert_eq!(
                    validate(p.as_object().unwrap(), "props").is_ok(),
                    expected,
                    "{name}/{count}"
                );
            }
        }
    }
    #[test]
    fn rejects_lossy_fields_and_duplicate_ids() {
        let mut p = props(3, "cards:filled");
        p["items"][0]["source"] = json!("Author");
        assert!(validate(p.as_object().unwrap(), "p").is_err());
        let mut p = props(3, "bullets");
        p["items"][1]["id"] = p["items"][0]["id"].clone();
        assert!(validate(p.as_object().unwrap(), "p").is_err());
        let mut p = props(3, "shape:petals");
        p["items"][0]["text"] = json!("");
        assert!(validate(p.as_object().unwrap(), "p").is_err());
        let mut p = props(3, "cards:top-icon");
        p["items"][0]["title"] = json!("");
        p["items"][0]["icon"] = json!("");
        assert!(validate(p.as_object().unwrap(), "p").is_ok());
    }
    #[test]
    fn icon_text_allows_missing_slots_and_retires_bullets_from_authoring() {
        let p = json!({"presentation":"icon-text","items":[{"id":"a","text":"Body"}],"itemColumns":3});
        assert!(validate(p.as_object().unwrap(), "p").is_ok());
        assert!(!PRESENTATIONS.contains(&"bullets"));
        assert!(validate(props(3, "bullets").as_object().unwrap(), "p").is_ok());
    }
    #[test]
    fn base_list_presentations_preserve_titles_and_reject_three_columns() {
        for presentation in ["list:unordered", "list:ordered"] {
            let mut p = props(5, presentation);
            p["title"] = json!("Collection title");
            p["itemColumns"] = json!(2);
            assert!(validate(p.as_object().unwrap(), "p").is_ok());
            p["itemColumns"] = json!(3);
            assert!(validate(p.as_object().unwrap(), "p").is_err());
        }
        let mut p = props(3, "cards:top-rule");
        p["title"] = json!("Preserved list title");
        assert!(validate(p.as_object().unwrap(), "p").is_ok());
    }

    #[test]
    fn marker_presentations_derive_decorations_without_author_fields() {
        for name in ["dot-card", "dot-list", "numbered-top-rule", "numbered-inline", "timeline-numbered", "timeline-dots", "timeline-dot-cards"] {
            let mut p = json!({"presentation": name, "items": [{"id":"a","title":"Title","text":"Body"}], "itemColumns":1});
            assert!(validate(p.as_object().unwrap(), "p").is_ok(), "{name}");
            p["itemColumns"] = json!(4);
            assert_eq!(validate(p.as_object().unwrap(), "p").is_ok(), !name.starts_with("timeline-"), "{name}");
            p["itemColumns"] = json!(1);
            p["items"][0]["number"] = json!(99);
            assert!(validate(p.as_object().unwrap(), "p").is_err(), "generated marker numbers are not business fields");
        }
    }

    #[test]
    fn ascending_columns_allow_five_and_keep_other_caps() {
        for presentation in ["ascending-bar", "ascending-arrow", "ascending-numbered"] {
            let mut p = props(6, presentation);
            p["itemColumns"] = json!(5);
            p["columnPreference"] = json!(5);
            assert!(validate(p.as_object().unwrap(), "props").is_ok());
            p["itemColumns"] = json!(6);
            assert!(validate(p.as_object().unwrap(), "props").is_err());
        }
        for presentation in ["numbered-parallelogram", "numbered-pill", "numbered-chevron", "cards:filled"] {
            let mut p = props(6, presentation);
            p["itemColumns"] = json!(5);
            assert!(validate(p.as_object().unwrap(), "props").is_err());
            p["itemColumns"] = json!(4);
            p["columnPreference"] = json!(5);
            assert!(validate(p.as_object().unwrap(), "props").is_ok());
        }
    }
