use super::*;

#[path = "image-options-tests.rs"]
mod image_options;

#[test]
fn semantic_icons_survive_shared_contract_and_bound_edit() {
    let fixtures: Value = serde_json::from_str(include_str!("../../../../../src/document/presentation/schema/markdown/fixtures.json")).unwrap();
    for case in fixtures.as_array().unwrap().iter().filter(|c| c["name"].as_str().unwrap().starts_with("semantic-icon-")) {
        let source = case["markdown"].as_str().unwrap();
        let parsed = compile(source, &[]).unwrap();
        assert_eq!(parsed.value, case["value"], "{}", case["name"]);
        assert_eq!(compile(&serialize(&parsed.value).unwrap(), &[]).unwrap().value, parsed.value);
        let slide = &parsed.value["deck"]["slides"][0];
        assert_eq!(compile_bound_slide(source, slide).unwrap(), *slide, "{}", case["name"]);
        crate::presentation::schema::contract::validate_authorable_deck_value(
            &parsed.value,
            crate::presentation::schema::contract::SlideDeckExpectations::new(1).unwrap(),
        ).unwrap();
    }
}

#[test]
fn descriptive_names_preserve_legacy_content_and_fix_their_selector() {
    let items = "items=<[title=A;text=Body;icon=Target;src=https://example.com/a.png],[title=B;text=Body;icon=Flag;src=https://example.com/b.png]>";
    for (name, preset) in contract()["authoring"]["presets"].as_object().unwrap() {
        let old = compile(&format!("# slide\n## contents={}\n{items}", preset["presentation"].as_str().unwrap()), &[]).unwrap();
        let new = compile(&format!("# slide\n## {name}\n{items}"), &[]).unwrap();
        assert_eq!(old.value, new.value, "{name}");
        assert_eq!(compile(&serialize_with_layout_overrides(&new.value).unwrap(), &[]).unwrap().value, new.value, "{name}");
    }
    for extra in ["=cards:filled", "\npresentation=cards:filled", "\n### presentation\ncards:filled"] {
        assert!(compile(&format!("# slide\n## dot-node-timeline{extra}\n{items}"), &[]).is_err());
    }
    assert_eq!(compile("# slide\n## numbered-list\nitems=<One,Two>", &[]).unwrap().value["deck"]["slides"][0]["blocks"][0]["type"], "ordered-list");
    for (name, variant) in contract()["authoring"]["groups"].as_object().unwrap() {
        let new = compile(&format!("# slide\n## {name}\n### text-paragraph\nHello"), &[]).unwrap();
        let old = compile(&format!("# slide\n## group={}\n### paragraph\nHello",variant.as_str().unwrap()), &[]).unwrap();
        assert_eq!(new.value, old.value, "{name}");
    }
}

#[test]
fn logo_inheritance_roundtrip_and_bound_edits() {
    let source = "logo=/yrkie-doe/brand/logo-text.webp\n# slide\n## paragraph\nInherited\n# slide\nlogo=none\n## paragraph\nHidden\n# slide\nlogo=https://example.com/logo.png\n## paragraph\nReplaced";
    let value = compile(source, &[]).unwrap().value;
    let pages = value["deck"]["slides"].as_array().unwrap();
    assert!(pages[0].get("logo").is_none());
    assert_eq!(pages[1].get("logo"), Some(&Value::Null));
    assert_eq!(pages[2]["logo"]["src"], "https://example.com/logo.png");
    assert_eq!(compile(&serialize(&value).unwrap(), &[]).unwrap().value, value);
    assert_eq!(compile_bound_slide("# slide\n## paragraph\nEdited", &pages[2]).unwrap()["logo"], pages[2]["logo"]);
    assert!(compile_bound_slide("# slide\nlogo=none\n## paragraph\nEdited", &pages[2]).unwrap()["logo"].is_null());
    let allowed = vec!["https://example.com/logo.png".to_string()];
    crate::presentation::schema::contract::validate_agent_image_sources_strict(&value, &allowed).unwrap();
    assert!(crate::presentation::schema::contract::validate_agent_image_sources_strict(&value, &[]).is_err());
}

#[test]
fn background_alignment_authoring_roundtrip_and_defaults() {
    for horizontal in ["left", "center", "right"] {
        for vertical in ["top", "center", "bottom"] {
            let source = format!("# slide\n## background\nsrc=https://example.com/background.png\ncontentAlign={horizontal}\ncontentVerticalAlign={vertical}\n## paragraph\nBody");
            let value = compile(&source, &[]).unwrap().value;
            assert_eq!(value["deck"]["slides"][0]["background"]["contentAlign"], horizontal);
            assert_eq!(value["deck"]["slides"][0]["background"]["contentVerticalAlign"], vertical);
            assert_eq!(compile(&serialize(&value).unwrap(), &[]).unwrap().value, value);
        }
    }
    for extra in ["", "\ncontentAlign=invalid\ncontentVerticalAlign=invalid"] {
        let value = compile(&format!("# slide\n## background\nsrc=https://example.com/background.png{extra}\n## paragraph\nBody"), &[]).unwrap().value;
        assert_eq!(value["deck"]["slides"][0]["background"]["contentAlign"], "center");
        assert_eq!(value["deck"]["slides"][0]["background"]["contentVerticalAlign"], "center");
    }
}

#[test]
fn registered_themes_survive_markdown_storage_roundtrip() {
    for theme in crate::presentation::schema::contract::registered_theme_ids().iter().map(String::as_str).chain(std::iter::once("unknown")) {
        let source = format!("# presentation\ntheme={theme}\n# slide\n## paragraph\ntext=Theme test");
        let value = compile(&source, &[]).unwrap().value;
        assert_eq!(value["deck"]["theme"], if theme == "unknown" { "yrkie-theme" } else { theme });
        assert_eq!(compile(&serialize(&value).unwrap(), &[]).unwrap().value, value);
    }
}

#[test]
fn background_content_width_roundtrips_without_materializing_a_default() {
    for width in ["0.2", "0.55", "1"] {
        for align in ["left", "center", "right"] {
            for source in [
                format!("# slide\n## background\nsrc=https://example.com/background.png\ncontentWidth={width}\ncontentAlign={align}\noverlay=false\n## paragraph\nBody"),
                format!("# slide\nbackground=[src=https://example.com/background.png;contentWidth={width};contentAlign={align};overlay=false]\n## paragraph\nBody"),
            ] {
                let compiled = compile(&source, &[]).unwrap();
                assert!(compiled.diagnostics.is_empty(), "{source}");
                assert_eq!(compiled.value["deck"]["slides"][0]["background"]["contentWidth"].as_f64(), width.parse::<f64>().ok());
                assert_eq!(compile(&serialize(&compiled.value).unwrap(), &[]).unwrap().value, compiled.value);
            }
        }
    }
    let source = "# slide\n## background\nsrc=https://example.com/background.png\noverlay=false\n## paragraph\nBody";
    let baseline = compile(source, &[]).unwrap().value;
    assert!(baseline["deck"]["slides"][0]["background"].get("contentWidth").is_none());
    assert_eq!(compile(&serialize(&baseline).unwrap(), &[]).unwrap().value, baseline);
    for invalid in ["0.19", "1.01", "false", "wide", "NaN", "Infinity"] {
        let compiled = compile(&source.replace("overlay=false", &format!("overlay=false\ncontentWidth={invalid}")), &[]).unwrap();
        assert_eq!(compiled.value, baseline, "{invalid}");
        assert!(compiled.diagnostics.iter().any(|d| d.code == "invalid_value" && d.path.ends_with("/contentWidth")), "{invalid}");
    }
}

#[test]
fn title_group_and_cover_aliases_preserve_the_same_editable_content() {
    let body = "title=One supported finding\nsubtitle=Supporting context\neyebrow=REVIEW\nalign=left";
    let expected = compile(&format!("# slide\n## hero\n{body}"), &[]).unwrap().value;
    for name in ["title-group", "cover-title", "cover"] {
        let compiled = compile(&format!("# slide\n## {name}\n{body}"), &[]).unwrap();
        assert!(compiled.diagnostics.is_empty(), "{name}");
        assert_eq!(compiled.value, expected, "{name}");
        let serialized = serialize(&compiled.value).unwrap();
        assert!(serialized.contains("## title-group"), "{name}");
        assert_eq!(compile(&serialized, &[]).unwrap().value, expected, "{name}");
    }
}

#[test]
fn design_options_roundtrip_and_invalid_markdown_falls_back_without_inserting_defaults() {
    let baseline = "# slide\nbackground=[src=https://example.com/background.png;overlay=false]\n## section-heading\ntext=Finding\nlevel=2\n## text-paragraph\ntext=Supporting explanation";
    let baseline = compile(baseline, &[]).unwrap().value;
    assert!(baseline["deck"]["slides"][0]["background"].get("textSurface").is_none());
    assert!(baseline["deck"]["slides"][0]["blocks"][0]["props"].get("variant").is_none());
    assert_eq!(compile(&serialize(&baseline).unwrap(), &[]).unwrap().value, baseline);
    for variant in ["section", "plain", "display"] {
        for surface in ["auto", "none"] {
            let source = format!("# slide\nbackground=[src=https://example.com/background.png;textSurface={surface};overlay=false]\n## section-heading\ntext=Finding\nlevel=2\nvariant={variant}\n## text-paragraph\ntext=Supporting explanation");
            let compiled = compile(&source, &[]).unwrap();
            assert!(compiled.diagnostics.is_empty(), "{source}");
            assert_eq!(compiled.value["deck"]["slides"][0]["background"]["textSurface"], surface);
            assert_eq!(compiled.value["deck"]["slides"][0]["blocks"][0]["props"]["variant"], variant);
            assert_eq!(compile(&serialize(&compiled.value).unwrap(), &[]).unwrap().value, compiled.value);
            crate::presentation::schema::contract::validation::validate_slide(&compiled.value["deck"]["slides"][0]).unwrap();
        }
    }
    for invalid in ["wrong", "false", "1", "PLAIN"] {
        let source = format!("# slide\nbackground=[src=https://example.com/background.png;textSurface={invalid};overlay=false]\n## section-heading\ntext=Finding\nlevel=2\nvariant={invalid}\n## text-paragraph\ntext=Supporting explanation");
        let compiled = compile(&source, &[]).unwrap();
        assert_eq!(compiled.value, baseline, "{invalid}");
        for suffix in ["/textSurface", "/variant"] {
            assert!(compiled.diagnostics.iter().any(|d| d.code == "invalid_value" && d.path.ends_with(suffix)), "{invalid}: {suffix}");
        }
    }
}

#[test]
fn compact_shared_equivalents_and_roundtrips() {
    let cases:Value=serde_json::from_str(include_str!("../../../../../src/document/presentation/schema/markdown/compact-fixtures.json")).unwrap();
    for case in cases.as_array().unwrap(){
        let result=compile(case["source"].as_str().unwrap(),&[]);
        if let Some(error)=case["error"].as_str(){assert!(result.err().unwrap().contains(error),"{}",case["name"]);continue;}
        let value=result.unwrap_or_else(|e|panic!("{}: {e}",case["name"])).value;
        assert_eq!(value,compile(case["equivalent"].as_str().unwrap(),&[]).unwrap().value,"{}",case["name"]);
        assert_eq!(value,compile(&serialize(&value).unwrap(),&[]).unwrap().value,"{}",case["name"]);
    }
    assert!(compile(&format!("# slide\n## bullets\nitems={}a{}","<".repeat(34),">".repeat(34)),&[]).err().unwrap().contains("compact_limit"));
}

#[test]
fn browser_server_markdown_contract_parity() {
    let cases: Value = serde_json::from_str(include_str!(
        "../../../../../src/document/presentation/schema/markdown/fixtures.json"
    ))
    .unwrap();
    for case in cases.as_array().unwrap() {
        let actual = compile(case["markdown"].as_str().unwrap(), &[]);
        if let Some(expected) = case["error"].as_str() {
            assert_eq!(actual.err().as_deref(), Some(expected), "{}", case["name"]);
            if let Some(diagnostics) = case.get("diagnostics") {
                let failure = compile_detailed(case["markdown"].as_str().unwrap(), &[]).err().unwrap();
                assert_eq!(serde_json::to_value(failure.diagnostics).unwrap(), *diagnostics, "{}", case["name"]);
            }
        } else {
            let actual = actual.unwrap_or_else(|e| panic!("{}: {e}", case["name"]));
            assert_eq!(actual.value, case["value"], "{}", case["name"]);
            assert_eq!(
                serde_json::to_value(actual.diagnostics).unwrap(),
                case["diagnostics"],
                "{}",
                case["name"]
            );
            let restored = compile(&serialize_with_layout_overrides(&actual.value).unwrap(), &[]).unwrap();
            assert_eq!(actual.value, restored.value, "serializer: {}", case["name"]);
            for slide in actual.value["deck"]["slides"].as_array().unwrap() {
                crate::presentation::schema::contract::validation::validate_slide(slide)
                    .unwrap_or_else(|e| panic!("validation {}: {e:?}", case["name"]));
            }
        }
    }
}

#[test]
fn conflicting_model_content_is_rejected_before_creation_or_bound_edit() {
    let cases: Value = serde_json::from_str(include_str!(
        "../../../../../src/document/presentation/schema/markdown/fixtures.json"
    )).unwrap();
    for case in cases.as_array().unwrap().iter().filter(|c| c["name"].as_str().unwrap().starts_with("content-conflict-real-")) {
        let raw = case["markdown"].as_str().unwrap();
        let expected_pages = if case["name"] == "content-conflict-real-minimal-poster" { 1 } else { 3 };
        let expectations = crate::presentation::schema::contract::SlideDeckExpectations::new(expected_pages).unwrap();
        let error = preview::process(raw, expectations, &[], false).err().unwrap();
        assert!(error.contains("conflicting_field_content"), "{}", case["name"]);
        let feedback = feedback::creation_failure(raw, expected_pages, &[], &error);
        assert_eq!(feedback["committed"], false);
        assert!(feedback["issues"].as_array().unwrap().iter().any(|issue|
            issue["code"] == "conflicting_field_content"
                && issue["message"].as_str().unwrap().contains("multiline content")
                && issue["path"].as_str().unwrap().contains("/props/")
        ), "{}", case["name"]);
    }
    let original = compile("# slide\n## text-paragraph\nSaved content", &["saved".into()]).unwrap().value["deck"]["slides"][0].clone();
    let snapshot = crate::presentation::edit::Snapshot {
        authoring_markdown: None,
        slide_id: "saved".into(), page_number: 1, slide_count: 1, revision: 4,
        slide: original.clone(), shared: json!({"title":"Deck","pageNumber":{"enabled":true,"format":"number"}}),
    };
    assert!(preview::prepare_edit(&snapshot, json!({"markdown":"# slide\n## text-paragraph\ntext=Keep this\nDifferent body"})).is_err());
    assert_eq!(snapshot.slide, original);
    assert_eq!(snapshot.revision, 4);
}

#[test]
fn repair_compiles_without_semantic_repair_flag_and_keeps_asset_guard() {
    let expectations =
        crate::presentation::schema::contract::SlideDeckExpectations::new(1).unwrap();
    let raw = "# slide\n## heading=invalid\nHello\nunknown=ignored";
    let processed = preview::process(raw, expectations, &[], false).unwrap();
    assert_eq!(processed.parsed.slides.len(), 1);
    assert!(processed
        .proof
        .operations
        .contains(&crate::presentation::repair::SlideAutoRepairV2Operation::MarkdownCompiled));
    assert!(!processed.proof.diagnostics.is_empty());
    assert!(preview::process(
        "# slide\n## media\nsrc=https://unapproved.example/image.png",
        expectations,
        &[],
        true
    )
    .is_err());
}

#[test]
fn unsupported_model_nodes_and_misplaced_deck_settings_fail_before_commit() {
    let cases: Value = serde_json::from_str(include_str!(
        "../../../../../src/document/presentation/schema/markdown/fixtures.json"
    )).unwrap();
    for case in cases.as_array().unwrap().iter().filter(|c| c["name"].as_str().unwrap().starts_with("lossless-gate-real-")) {
        let raw = case["markdown"].as_str().unwrap();
        let expectations = crate::presentation::schema::contract::SlideDeckExpectations::new(2).unwrap();
        let error = preview::process(raw, expectations, &[], false).err().unwrap();
        let code = if case["name"] == "lossless-gate-real-technical-placeholder" { "unknown_component" } else { "misplaced_field" };
        assert!(error.contains(code), "{}", case["name"]);
        let feedback = feedback::creation_failure(raw, 2, &[], &error);
        assert_eq!(feedback["committed"], false);
        let issue = feedback["issues"].as_array().unwrap().iter().find(|i| i["code"] == code).unwrap();
        assert!(issue["message"].as_str().unwrap().contains(if code == "misplaced_field" { "before the first # slide" } else { "preserving its intended content" }));
    }
    let original = compile("# slide\n## paragraph\nSaved content", &["saved".into()]).unwrap().value["deck"]["slides"][0].clone();
    let snapshot = crate::presentation::edit::Snapshot {
        authoring_markdown: None, slide_id: "saved".into(), page_number: 1, slide_count: 1, revision: 4,
        slide: original.clone(), shared: json!({"title":"Deck","pageNumber":{"enabled":true,"format":"number"}}),
    };
    for raw in ["# slide\n## paragraph\nKeep\n## bar-chart-placeholder\nLost", "# slide\ntheme=yrkie-ledger\n## paragraph\nKeep"] {
        assert!(preview::prepare_edit(&snapshot, json!({"markdown":raw})).is_err());
        assert_eq!(snapshot.slide, original);
        assert_eq!(snapshot.revision, 4);
    }
}

#[test]
fn bound_redesign_preserves_unchanged_nodes_and_host_state() {
    let original = json!({"id":"saved","size":{"width":960,"height":540,"unit":"pt"},"editor":false,"blocks":[{"id":"title-stable","type":"heading","props":{"text":"Title"},"meta":{"custom":"retained"}},{"id":"body-stable","type":"text","props":{"text":"Old"}}]});
    let new = compile_bound_slide("# slide\n## heading\nTitle\n## text\nNew", &original).unwrap();
    assert_eq!(new["blocks"][0], original["blocks"][0]);
    assert_eq!(new["blocks"][1]["id"], "body-stable");
    assert_eq!(new["id"], "saved");
    assert_eq!(new["editor"], false);
    assert!(
        compile_bound_slide("# slide\n## text\nOne\n# slide\n## text\nTwo", &original).is_err()
    );
}

#[test]
fn editing_uses_host_page_identity() {
    let result = compile("# slide\n## text\nContent", &["existing-page".into()]).unwrap();
    assert_eq!(result.value["deck"]["slides"][0]["id"], "existing-page");
    assert_eq!(
        result.value["deck"]["slides"][0]["blocks"][0]["id"],
        "existing-page-1"
    );
}

#[test]
fn markdown_edit_passes_the_transaction_candidate_gate() {
    use crate::presentation::edit::Snapshot;
    let before = Snapshot {
        authoring_markdown: None,
        slide_id: "saved-page".into(), page_number: 1, slide_count: 1, revision: 7,
        slide: compile("# slide\n## heading\nOriginal", &["saved-page".into()]).unwrap().value["deck"]["slides"][0].clone(),
        shared: json!({"title":"Deck","pageNumber":{"enabled":true,"format":"number"}}),
    };
    let updated = preview::prepare_edit(&before, json!({"markdown":"# slide\n## heading=bad\nUpdated\nunknown=ignored"})).unwrap();
    assert_eq!(updated["id"], before.slide_id);
    assert_eq!(updated["blocks"][0]["id"], before.slide["blocks"][0]["id"]);
    assert_eq!(updated["blocks"][0]["props"]["text"], "Updated");
    assert!(preview::prepare_edit(&before, json!({"markdown":"# slide\n## heading\nUpdated","operations":[]})).is_err());
    assert!(preview::prepare_edit(&before, json!({"markdown":"# slide\n## media\nsrc=https://unapproved.example/image.png"})).is_err());
    assert_eq!(before.revision, 7);
    assert_eq!(before.slide["blocks"][0]["props"]["text"], "Original");
}

#[test]
fn explicit_alignment_and_legacy_isolation() {
    let expectations = crate::presentation::schema::contract::SlideDeckExpectations::new(1).unwrap();
    let raw = "# slide\n## title\nalign=center\nTitle\n## paragraph\nalign=right\nBody\n## cover\nalign=right\neyebrow=Context\nHero";
    let parsed = preview::process(raw, expectations, &[], true).unwrap().parsed;
    assert_eq!(parsed.slides[0]["blocks"][0]["props"]["align"], "center");
    assert_eq!(parsed.slides[0]["blocks"][1]["props"]["align"], "right");
    assert_eq!(parsed.slides[0]["blocks"][2]["props"]["align"], "right");
    assert_eq!(parsed.slides[0]["blocks"][2]["props"]["eyebrow"], "Context");
    assert!(crate::presentation::repair::process(raw, expectations, &[], true).is_err());
}

#[test]
fn bound_edit_keeps_manual_columns_and_unchanged_text_formatting() {
    let old = json!({"id":"saved","blocks":[{"id":"cards","type":"item-cards","props":{"itemLayout":"grid","itemColumns":4,"items":[{"title":"Title","text":"Old"}]},"textOverrides":[{"path":["items",0,"title"],"text":"Title","runs":[{"start":0,"end":5,"bold":true}]}]}]});
    let source = "# slide\n## cards\n### item\ntitle=Title\ntext=Updated";
    let next = compile_bound_slide(source, &old).unwrap();
    assert_eq!(next["blocks"][0]["props"]["itemColumns"],4);
    assert_eq!(next["blocks"][0]["textOverrides"],old["blocks"][0]["textOverrides"]);
    assert!(!serialize(&old).unwrap().contains("itemColumns"));
    let explicit = compile_bound_slide("# slide\n## cards\nitemColumns=2\n### item\ntitle=Title\ntext=Old", &old).unwrap();
    assert_eq!(explicit["blocks"][0]["props"]["itemColumns"],2);
}

#[test]
fn multiline_metadata_is_literal_and_defaults_stay_hidden() {
    let title = "Title\n# slide\n## paragraph\nNot another page";
    let original = json!({"pageNumber":{"enabled":false,"format":"fraction"},"deck":{"title":title,"slides":[{"blocks":[{"type":"text","props":{"text":"Actual page"}}]}]}});
    let result = compile(&serialize(&original).unwrap(), &[]).unwrap().value;
    assert_eq!(result["deck"]["title"], title);
    assert_eq!(result["deck"]["slides"].as_array().unwrap().len(), 1);
    assert_eq!(result["pageNumber"], original["pageNumber"]);
    let simple = compile("# slide\n## paragraph\nBody", &[]).unwrap().value;
    assert!(!serialize(&simple).unwrap().contains("title="));
}
#[test]
fn metric_collections_preserve_labels_and_defaults() {
    let source = "# slide\n## layout=metrics\nitems=<[title=\"80%\";label=\"达成率\";text=\"原始说明\"],[title=\"120\";label=\"人数\"]>";
    let value = compile(source, &[]).unwrap().value;
    assert_eq!(value["deck"]["slides"][0]["blocks"][0]["props"]["presentation"], "metrics");
    assert_eq!(value["deck"]["slides"][0]["blocks"][0]["props"]["itemColumns"], "auto");
    assert_eq!(compile(&serialize(&value).unwrap(), &[]).unwrap().value, value);
}
