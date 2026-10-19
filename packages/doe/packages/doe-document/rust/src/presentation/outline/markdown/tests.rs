use super::*;

#[test]
fn headline_description_fixture_matches_editor_input_without_splitting_literal_lines() {
    // The frontend renders this same JSON fixture through the real Work editor.
    let expected: Value = serde_json::from_str(include_str!("fixtures/headline-description.json")).unwrap();
    let compiled = compile(include_str!("fixtures/headline-description.md")).unwrap();
    assert!(compiled.diagnostics.is_empty());
    assert_eq!(compiled.outline, expected);
    assert_eq!(compile(&serialize(&expected).unwrap()).unwrap().outline, expected);

    // Legacy multiline units remain literal. Fixing author guidance must not
    // reinterpret existing titles, poetry, tables or other multiline content.
    let legacy = compile("# page\n## text\nA multiline unit\nIts second line").unwrap();
    assert_eq!(legacy.outline["body"][0]["contents"], json!(["A multiline unit\nIts second line"]));
}

#[test]
fn derives_identity_and_ignores_system_fields() {
    let compiled = compile("title=方案\npage_count=abc\noperation=replace\nexpected_revision=99\n# page\nindex=100\n## text\n保留原文。\n# page=行动\n## text\n完成复核。").unwrap();
    assert_eq!(
        compiled.outline,
        json!({"title":"方案","page_count":2,"body":[{"index":1,"page":1,"contents":["保留原文。"]},{"index":2,"page":2,"contents":["行动","完成复核。"]}]})
    );
    assert_eq!(compiled.diagnostics.len(), 4);
    let decoded = decode("operation=edit\nexpected_revision=90\n# page\n## text\n标题").unwrap();
    assert!(matches!(
        decoded.operation,
        decode::OutlineOperation::Create
    ));
    assert_eq!(decoded.expected_revision, None);
    assert_eq!(decoded.outline.title, "标题");
}

#[test]
fn image_defaults_and_all_supported_enums_use_actual_materializer() {
    for image_type in [
        "",
        "type=abc\n",
        "type=\"content\"\n",
        "type=content\n",
        "type=decorative\n",
    ] {
        for ratio in std::iter::once("")
            .chain(std::iter::once("abc"))
            .chain(PRODUCT_IMAGE_RATIOS.iter().copied())
        {
            let source = format!("# page\n## text\n配图\n## generateimg\n{image_type}ratio={ratio}\nunknown=value\n真实设备（完整主体），无文字。");
            let compiled = compile(&source).unwrap();
            let plans = image_placeholder::scan(&compiled.outline).unwrap();
            assert_eq!(plans.len(), 1);
            assert_eq!(
                plans[0].image_type.as_str(),
                if image_type == "type=content\n" {
                    "content"
                } else {
                    "decorative"
                }
            );
            assert_eq!(
                plans[0].ratio,
                if PRODUCT_IMAGE_RATIOS.contains(&ratio) {
                    ratio
                } else {
                    "16:9"
                }
            );
            assert_eq!(plans[0].prompt, "真实设备（完整主体），无文字。");
            let mut materialized = compiled.outline;
            let asset = format!("yrkie-asset-data://{}", "a".repeat(64));
            image_placeholder::replace_source(
                &mut materialized,
                &plans[0].json_pointer,
                &plans[0].source,
                &asset,
            )
            .unwrap();
            assert_eq!(materialized["body"][0]["contents"][0], "配图");
            assert_eq!(materialized["body"][0]["contents"][1], asset);
            assert!(image_placeholder::scan(&materialized).unwrap().is_empty());
            assert!(image_placeholder::replace_source(
                &mut materialized,
                &plans[0].json_pointer,
                &plans[0].source,
                &asset
            )
            .is_err());
        }
    }
}

#[test]
fn duplicate_invalid_optional_value_resets_to_default() {
    let out = compile(
        "# page\n## generateimg\ntype=content\ntype=wrong\nratio=4:3\nratio=wrong\nprompt=设备\n",
    )
    .unwrap();
    assert_eq!(
        out.outline["body"][0]["contents"][0],
        "GENRATEIMG[type=decorative,ratio=16:9](设备)"
    );
    assert_eq!(
        out.diagnostics
            .iter()
            .filter(|d| d.code == "duplicate_field_last_wins")
            .count(),
        2
    );
}

#[test]
fn roundtrip_preserves_literal_text_assets_and_multiline_image_prompts() {
    let source = "title=演示\n# page\n## text\n````\n# 标题原文\na=b\n```\n保留\\n与\t制表符\n````\n## generateimg\ntype=content\n### prompt\n```\n# 主体\na=b\n第二行 (完整)\n```\n## text\nyrkie-asset-data://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    let original = compile(source).unwrap().outline;
    let encoded = serialize(&original).unwrap();
    assert!(!encoded.contains("ratio=16:9"));
    assert_eq!(compile(&encoded).unwrap().outline, original);
    assert_eq!(
        original["body"][0]["contents"][0],
        "# 标题原文\na=b\n```\n保留\\n与\t制表符"
    );
    assert!(is_markdown(&format!("```markdown\n{encoded}```")));
    assert_eq!(
        compile(&format!("```markdown\n{encoded}```"))
            .unwrap()
            .outline,
        original
    );
}

#[test]
fn aliases_and_legacy_image_spellings_preserve_prompt() {
    let legacy = compile("# page\n## text\n图片计划的设计\n## text\nGENRATEIMG[4:3](设备)").unwrap().outline;
    assert_eq!(legacy["title"], "图片计划的设计");
    assert_eq!(image_placeholder::scan(&legacy).unwrap()[0].ratio, "4:3");
    for marker in ["generateimg", "GENRATEIMG", "generate_img", "genrateimg"] {
        let source =
            format!("# outline\n## slide\n### text\n{marker}[type=wrong,ratio=wrong](机器 (完整))");
        assert_eq!(
            compile(&source).unwrap().outline["body"][0]["contents"][0],
            "GENRATEIMG[type=decorative,ratio=16:9](机器 (完整))"
        );
    }
    assert_eq!(
        compile("# page\n## genrateimg\n机器").unwrap().outline["page_count"],
        1
    );
}

#[test]
fn refuses_missing_real_content_and_resource_overflow_without_filler() {
    for source in [
        "# page",
        "# page\n## generateimg\nratio=4:3",
        "# page\n## unknown\nnot content",
        "# page\n## text\n```\nunclosed",
    ] {
        assert!(compile(source).is_err(), "{source}");
    }
    assert!(compile(&format!("# page\n## text\n{}", "中".repeat(2667))).is_err());
    assert!(compile(&"# page\n## text\nA\n".repeat(101)).is_err());
    assert!(compile(&format!("# page\n{}", "## text\nA\n".repeat(101))).is_err());
    assert!(compile(&format!("# page\n{}", "## generateimg\n设备\n".repeat(17))).is_err());
    assert!(compile(&format!("# page\n{}", "## generateimg\n设备\n".repeat(16))).is_ok());
    assert!(compile(&"x".repeat(limits::MAX_OUTLINE_RESPONSE_BYTES + 1)).is_err());
}

#[test]
fn preview_is_read_only_and_skips_unfinished_nodes() {
    let prefix = "# page\n## text\n封面\n## generateimg\nratio=4:3\n";
    let value = preview(prefix).unwrap();
    assert_eq!(value["body"][0]["contents"], json!(["封面"]));
    assert_eq!(
        preview(&format!("{prefix}机器\n# page\n")).unwrap()["page_count"],
        1
    );
    assert_eq!(
        preview(&format!("{prefix}机器\n# page\n## text\n第二页\n")).unwrap()["page_count"],
        2
    );
    assert!(preview("# page\n## text\n尚未结束").is_none());
}

#[test]
fn formal_decoders_and_recovery_accept_markdown_but_keep_legacy_json() {
    let raw = "# page\n## text\n原文😀\n## generateimg\ntype=wrong\n机器";
    let strict = super::super::decode::decode_doe_traditional_outline(raw).unwrap();
    let compatible =
        super::super::decode::decode_doe_traditional_outline_without_schema_validation(raw)
            .unwrap();
    assert_eq!(strict.canonical_json, compatible.canonical_json);
    let recovered = super::super::authoring::parse_and_validate(raw).unwrap();
    assert_eq!(recovered.canonical_json, strict.canonical_json);
    assert_eq!(recovered.repair_proof.contract_version, VERSION);
    assert_eq!(
        recovered.repair_proof.input_sha256,
        super::super::recovery::diagnostics::sha256_hex(raw.as_bytes())
    );
    assert!(recovered.repair_proof.schema_passed);
    assert_eq!(recovered.repair_proof.output_sha256, super::super::recovery::diagnostics::sha256_hex(recovered.canonical_json.as_bytes()));
    assert_eq!(recovered.image_type_repair_count, 1);
    assert!(!is_markdown(&strict.canonical_json));
    assert!(super::super::decode::decode_doe_traditional_outline(&strict.canonical_json).is_ok());
}

#[test]
fn background_removal_boolean_roundtrips_and_overrides_legacy_type() {
    for (settings, expected) in [
        ("", "decorative"),
        ("removeBackground=true\n", "content"),
        ("removeBackground=false\n", "decorative"),
        ("type=content\n", "content"),
        ("removeBackground=false\ntype=content\n", "decorative"),
        ("type=decorative\nremoveBackground=true\n", "content"),
    ] {
        let raw = format!("# page\n## generateimg\n{settings}ratio=4:3\nA photographic blue mug");
        let value = compile(&raw).unwrap().outline;
        let images = image_placeholder::scan(&value).unwrap();
        assert_eq!(images[0].image_type.as_str(), expected);
        assert_eq!(images[0].prompt, "A photographic blue mug");
        let markdown = serialize(&value).unwrap();
        assert!(!markdown.contains("type="));
        assert_eq!(markdown.contains("removeBackground=true"), expected == "content");
        assert_eq!(compile(&markdown).unwrap().outline, value);
    }
    assert!(compile("# page\n## generateimg\nremoveBackground=yes\nA mug").is_err());
}
