use super::*;
#[test]
    fn doe_production_decoder_canonicalizes_near_generated_image_marker_names() {
        let output = json!({
            "outline": {
                "title": "Image marker fallback",
                "body": [{
                    "contents": [
                        "Page title",
                        "generate_img[type=content,ratio=4:3](a flat fire truck diagram, no text)",
                        "Mention generateimg(example) as ordinary prose"
                    ]
                }]
            }
        });

        let decoded = decode_doe_traditional_outline_without_schema_validation(&output.to_string())
            .expect("decode DOE marker fallback");
        assert_eq!(
            decoded.outline.body[0].contents[1],
            "GENRATEIMG[type=content,ratio=4:3](a flat fire truck diagram, no text)"
        );
        assert_eq!(
            decoded.outline.body[0].contents[2],
            "Mention generateimg(example) as ordinary prose"
        );
        assert!(decoded
            .canonical_json
            .contains("GENRATEIMG[type=content,ratio=4:3](a flat fire truck diagram, no text)"));
    }
