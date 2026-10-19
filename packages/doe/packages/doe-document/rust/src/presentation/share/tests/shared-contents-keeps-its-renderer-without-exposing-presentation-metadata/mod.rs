use super::*;
#[test]
    fn shared_contents_keeps_its_renderer_without_exposing_presentation_metadata() {
        for presentation in ["cards:filled", "shape:pyramid", "list:unordered", "icon-text"] {
            let mut slide = json!({"presentation":{"notes":"private"},"blocks":[{
                "type":"layout-group","children":[{"type":"contents","props":{
                    "presentation":presentation,"speakerNotes":"private",
                    "items":[{"text":"Visible", "presentation":{"notes":"private"}}]
                }}]
            }]});
            strip_private(&mut slide);
            assert_eq!(slide["blocks"][0]["children"][0]["props"]["presentation"], presentation);
            assert!(!slide.to_string().contains("private"));
            assert!(slide.get("presentation").is_none());
        }
        let mut slide = json!({"type":"contents","props":{"presentation":{"notes":"private"}}});
        strip_private(&mut slide);
        assert!(slide["props"].get("presentation").is_none());
    }
