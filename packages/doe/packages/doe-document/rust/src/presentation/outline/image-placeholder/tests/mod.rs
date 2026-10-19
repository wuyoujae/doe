
    use super::*;
    use serde_json::json;

    #[test]
    fn scans_only_complete_v1_content_markers() {
        let document = json!({
            "title": "Deck",
            "page_count": 1,
            "body": [{
                "index": 1,
                "page": 1,
                "contents": [
                    "Title",
                    "GENRATEIMG(a product launch scene (without text))",
                    "Mention GENRATEIMG(example) as prose"
                ]
            }]
        });

        let placeholders = scan(&document).expect("scan DOE V1");
        assert_eq!(placeholders.len(), 1);
        assert_eq!(placeholders[0].json_pointer, "/body/0/contents/1");
        assert_eq!(
            placeholders[0].prompt,
            "a product launch scene (without text)"
        );
        assert_eq!(placeholders[0].ratio, "16:9");
        assert_eq!(placeholders[0].image_type, GeneratedImageType::Decorative);
    }

    #[test]
    fn scans_explicit_ratios_without_splitting_prompt_punctuation() {
        for ratio in PRODUCT_IMAGE_RATIOS {
            let source = format!(
                "GENRATEIMG[ratio={ratio}](a launch scene, blue light, people (without text), no watermark)"
            );
            let document = json!({"body": [{"contents": [source.clone()]}]});

            let placeholders = scan(&document).expect("scan configured DOE marker");
            assert_eq!(placeholders.len(), 1);
            assert_eq!(placeholders[0].source, source);
            assert_eq!(
                placeholders[0].prompt,
                "a launch scene, blue light, people (without text), no watermark"
            );
            assert_eq!(placeholders[0].ratio, ratio);
            assert_eq!(placeholders[0].image_type, GeneratedImageType::Decorative);
        }
    }

    #[test]
    fn scans_explicit_image_types() {
        for image_type in ["content", "decorative"] {
            let source =
                format!("GENRATEIMG[type={image_type},ratio=4:3](an isolated fire truck, no text)");
            let document = json!({"body": [{"contents": [source]}]});
            let placeholders = scan(&document).expect("scan typed DOE marker");
            assert_eq!(placeholders.len(), 1);
            assert_eq!(placeholders[0].ratio, "4:3");
            assert_eq!(placeholders[0].image_type.as_str(), image_type);
        }
    }

    #[test]
    fn scans_bounded_near_marker_names_without_changing_the_placeholder_source() {
        for source in [
            "generateimg[type=content,ratio=4:3](an isolated fire truck, no text)",
            "genrateimg[ratio=3:4](a vertical diagram, no text)",
            "GENERATE_IMG(a wide decorative scene, no text)",
            "GENERATIMG(a one-letter typo, no text)",
            "GENERATEMIG(a transposed marker name, no text)",
        ] {
            let document = json!({"body": [{"contents": [source]}]});
            let placeholders = scan(&document).expect("scan near DOE marker name");
            assert_eq!(placeholders.len(), 1, "did not recover marker: {source}");
            assert_eq!(placeholders[0].source, source);
        }
    }

    #[test]
    fn canonicalizes_only_bounded_marker_names_at_the_content_item_start() {
        assert_eq!(
            normalize_marker_source("Generate-Img[ratio=1:1](diagram)"),
            Some("GENRATEIMG[ratio=1:1](diagram)".to_string())
        );
        assert_eq!(
            normalize_marker_source("Mention generateimg(example) as prose"),
            None
        );
        assert_eq!(normalize_marker_source("RENDERIMAGE(example)"), None);
        assert_eq!(normalize_marker_source("yrkie-asset-data://asset-1"), None);
    }

    #[test]
    fn replaces_only_the_exact_placeholder_path() {
        let mut document = json!({
            "body": [{"contents": ["GENRATEIMG(a diagram)"]}]
        });
        replace_source(
            &mut document,
            "/body/0/contents/0",
            "GENRATEIMG(a diagram)",
            "yrkie-asset-data://asset-1",
        )
        .expect("replace marker");
        assert_eq!(
            document["body"][0]["contents"][0],
            "yrkie-asset-data://asset-1"
        );
    }

    #[test]
    fn rejects_malformed_markers_without_repairing_them() {
        for source in [
            "GENRATEIMG(prompt",
            "GENRATEIMG[ratio=1:1](prompt",
            "GENRATEIMG[ratio =1:1](prompt)",
            "GENRATEIMG[ratio=1:1,quality=high](prompt)",
            "GENRATEIMG[quality=high](prompt)",
            "GENRATEIMG[ratio=2:1](prompt)",
            "GENRATEIMG[ratio=1:1]()",
            "GENRATEIMG[type=content](prompt)",
            "GENRATEIMG[type=unknown,ratio=1:1](prompt)",
            "GENRATEIMG[ratio=1:1,type=content](prompt)",
            "GENRATEIMG[type=content,ratio=2:1](prompt)",
        ] {
            let document = json!({"body": [{"contents": [source]}]});
            assert!(
                scan(&document).is_err(),
                "accepted malformed marker: {source}"
            );
        }
    }
