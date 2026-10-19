use super::*;

fn body(name: &str) -> &'static str {
    if name == "image-above-text" { "items=<[src=https://example.com/image.png;alt=Original image;title=Original title;text=Original fact]>" }
    else { "src=https://example.com/image.png\nalt=Original image\ntitle=Original title\ntext=Original fact" }
}

#[test]
fn image_options_roundtrip_and_bound_edit_without_default_injection() {
    for name in ["image-above-text", "image-caption"] {
        let old = compile(&format!("# slide\n## {name}\n{}", body(name)), &[]).unwrap().value;
        for key in ["imageSize", "imageFit", "imageAspectRatio", "surface"] { assert!(old["deck"]["slides"][0]["blocks"][0]["props"].get(key).is_none()); }
        assert_eq!(compile(&serialize(&old).unwrap(), &[]).unwrap().value, old);
        for size in ["compact", "full"] { for fit in ["contain", "cover"] { for aspect in ["1:1", "4:3", "3:4", "16:9"] { for surface in ["none", "soft"] {
            let source = format!("# slide\n## {name}\nimageSize={size}\nimageFit={fit}\nimageAspectRatio={aspect}\nsurface={surface}\n{}", body(name));
            let parsed = compile(&source, &[]).unwrap();
            assert!(parsed.diagnostics.is_empty());
            let slide = &parsed.value["deck"]["slides"][0];
            for (key, expected) in [("imageSize",size),("imageFit",fit),("imageAspectRatio",aspect),("surface",surface)] { assert_eq!(slide["blocks"][0]["props"][key], expected); }
            assert_eq!(compile(&serialize(&parsed.value).unwrap(), &[]).unwrap().value, parsed.value);
            assert_eq!(compile_bound_slide(&source, slide).unwrap(), *slide);
            let edited = compile_bound_slide(&source.replace("Original fact", "Updated fact"), slide).unwrap();
            for key in ["imageSize", "imageFit", "imageAspectRatio", "surface"] { assert_eq!(edited["blocks"][0]["props"][key], slide["blocks"][0]["props"][key]); }
            let snapshot = crate::presentation::edit::Snapshot {
                authoring_markdown: None, slide_id: slide["id"].as_str().unwrap().into(),
                page_number: 1, slide_count: 1, revision: 7, slide: slide.clone(),
                shared: json!({"title":parsed.value["deck"]["title"],"theme":parsed.value["deck"]["theme"],"pageNumber":{"enabled":true,"format":"number"}}),
            };
            let prepared = prepare_edit(&snapshot, json!({"markdown":source.replace("Original fact", "Updated fact")})).unwrap();
            assert_eq!(prepared, edited);
            assert_eq!(snapshot.slide, *slide);
            crate::presentation::schema::contract::validate_authorable_deck_value(&parsed.value, crate::presentation::schema::contract::SlideDeckExpectations::new(1).unwrap()).unwrap();
        }}}}
    }
}

#[test]
fn image_options_diagnose_bad_values_and_reject_other_presentations() {
    for (key, value) in [("imageSize","full"),("imageFit","cover"),("imageAspectRatio","16:9"),("surface","soft")] {
        for name in ["image-above-text", "image-caption"] {
            for invalid in ["unsupported", "true", "7", "<full,compact>"] {
                let parsed = compile(&format!("# slide\n## {name}\n{key}={invalid}\n{}", body(name)), &[]).unwrap();
                assert!(parsed.diagnostics.iter().any(|d| d.path.ends_with(&format!("/{key}")) && d.code == "invalid_value"));
                assert!(parsed.value["deck"]["slides"][0]["blocks"][0]["props"].get(key).is_none());
            }
        }
        for name in ["filled-cards", "contents=icon-text"] {
            let raw = format!("# slide\n## {name}\n{key}={value}\nitems=<[title=Original;text=Body]>");
            let failure = compile(&raw, &[]).err().unwrap();
            assert!(failure.contains("image_options_presentation"));
            let feedback = feedback::creation_failure(&raw, 1, &[], &failure);
            assert_eq!(feedback["committed"], false);
            assert_eq!(feedback["issues"][0]["code"], "image_options_presentation");
            assert!(feedback["issues"][0]["message"].as_str().unwrap().contains("image-above-text or image-caption"));
        }
    }
}
