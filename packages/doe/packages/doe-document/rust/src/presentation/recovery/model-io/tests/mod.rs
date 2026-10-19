
    use super::*;
    use crate::presentation::recovery::{plan_page_repairs, SlideRecoveryDisposition};

    fn broken_plan() -> SlidePageRepairPlan {
        let raw = json!({
            "version": 4,
            "pageNumber": {"enabled": true, "format": "number"},
            "deck": {"title": "Test", "theme": "yrkie-theme", "slides": [{
                "id": "slide-1",
                "size": {"width": 960, "height": 540, "unit": "pt"},
                "blocks": [{"id": "heading", "type": "heading", "props": {}}]
            }]}
        })
        .to_string();
        plan_page_repairs(&raw, SlideDeckExpectations::new(1).unwrap(), &[]).unwrap()
    }

    #[test]
    fn repair_response_is_base_and_page_hash_bound() {
        let plan = broken_plan();
        let response = json!({
            "base_deck_sha256": plan.base_deck_sha256,
            "repairs": [{
                "page_index": 0,
                "expected_page_sha256": plan.targets[0].page_sha256,
                "slide": {
                    "id": "slide-1",
                    "size": {"width": 960, "height": 540, "unit": "pt"},
                    "blocks": [{"id": "heading", "type": "heading", "props": {"text": "Fixed"}}]
                }
            }]
        });
        let replacements = parse_page_repair_response(&response.to_string(), &plan).unwrap();
        assert_eq!(replacements.len(), 1);

        let mut stale = response;
        stale["base_deck_sha256"] = Value::String("0".repeat(64));
        assert!(parse_page_repair_response(&stale.to_string(), &plan).is_err());
    }

    #[test]
    fn repair_response_accepts_only_unique_safe_transport_envelopes() {
        let plan = broken_plan();
        let response = json!({
            "base_deck_sha256": plan.base_deck_sha256,
            "repairs": [{
                "page_index": 0,
                "expected_page_sha256": plan.targets[0].page_sha256,
                "slide": {
                    "id": "slide-1",
                    "size": {"width": 960, "height": 540, "unit": "pt"},
                    "blocks": [{"id": "heading", "type": "heading", "props": {"text": "Fixed"}}]
                }
            }]
        });
        let mut metadata = response.clone();
        metadata["status"] = Value::String("completed".to_string());
        metadata["schema_version"] = Value::from(1);
        assert_eq!(
            parse_page_repair_response(&metadata.to_string(), &plan)
                .unwrap()
                .len(),
            1
        );

        let wrapped = json!({"status": "completed", "result": response});
        assert_eq!(
            parse_page_repair_response(&wrapped.to_string(), &plan)
                .unwrap()
                .len(),
            1
        );

        let ambiguous = json!({
            "result": wrapped["result"],
            "output": {
                "base_deck_sha256": plan.base_deck_sha256,
                "repairs": [{
                    "page_index": 0,
                    "expected_page_sha256": plan.targets[0].page_sha256,
                    "slide": {
                        "id": "slide-1",
                        "size": {"width": 960, "height": 540, "unit": "pt"},
                        "blocks": [{"id": "heading", "type": "heading", "props": {"text": "Different"}}]
                    }
                }]
            }
        });
        assert_eq!(
            parse_page_repair_response(&ambiguous.to_string(), &plan).unwrap_err(),
            "slide_recovery_model_output_ambiguous_wrapper"
        );

        let mut unsafe_extra = wrapped["result"].clone();
        unsafe_extra["explanation"] = Value::String("business-bearing text".to_string());
        assert_eq!(
            parse_page_repair_response(&unsafe_extra.to_string(), &plan).unwrap_err(),
            "slide_recovery_model_output_repair response_shape"
        );
    }

    #[test]
    fn envelope_contract_failures_do_not_repeat_the_same_expensive_model_path() {
        assert!(!output_error_allows_clean_retry(
            "slide_recovery_model_output_repair response_shape"
        ));
        assert!(!output_error_allows_clean_retry(
            "slide_recovery_model_output_scope_count"
        ));
        assert!(output_error_allows_clean_retry(
            "slide_recovery_model_output_invalid_json"
        ));
        assert!(output_error_allows_clean_retry(
            "slide_recovery_model_output_page repair_shape"
        ));
    }

    #[test]
    fn deterministic_fallback_uses_only_outline_text() {
        let plan = broken_plan();
        let context = json!({
            "confirmed_outline": {"outline": {"slides": [{
                "page_number": 1,
                "contents": {
                    "title": {"body": "Grounded title"},
                    "body": {"body": "Grounded body"}
                }
            }]}}
        });
        let replacements = deterministic_fallback_replacements(&plan, &context).unwrap();
        crate::presentation::recovery::grounding::validate_page_replacement_provenance(
            &plan,
            &replacements,
            &context,
            crate::presentation::recovery::grounding::ReplacementProvenanceMode::Clean,
        )
        .expect("fallback text must remain fully derived from the confirmed Outline");
        assert_eq!(
            replacements[0].slide["blocks"][0]["props"]["text"],
            "Grounded title"
        );
        assert_eq!(
            replacements[0].slide["blocks"][1]["props"]["text"],
            "Grounded body"
        );
        let outcome = super::super::apply_page_replacements(
            &plan,
            &replacements,
            SlideDeckExpectations::new(1).unwrap(),
            &[],
            SlideRecoveryDisposition::DeterministicFallback,
        )
        .unwrap();
        assert_eq!(
            outcome.proof.disposition,
            SlideRecoveryDisposition::DeterministicFallback
        );

        let minimal = deterministic_minimal_fallback_replacements(&plan, &context).unwrap();
        assert!(minimal[0].slide["blocks"].as_array().unwrap().len() == 1);
        assert!(
            minimal[0].slide["blocks"][0]["props"]["text"]
                .as_str()
                .unwrap()
                .chars()
                .count()
                <= 64
        );
    }

    #[test]
    fn deterministic_fallback_never_promotes_outline_design_descriptions_to_slide_facts() {
        let plan = broken_plan();
        let context = json!({
            "confirmed_outline": {"outline": {"slides": [{
                "page_number": 1,
                "contents": {
                    "company_name": {
                        "body": "星辰科技",
                        "describe": "公司名称位于页面主标题上方。"
                    },
                    "title": {
                        "body": "2026 年度工作汇报",
                        "describe": "封面主标题。"
                    },
                    "subtitle": {
                        "body": "稳健增长 · 创新前行",
                        "describe": "封面副标题，概括全年主题。"
                    },
                    "background_image": {
                        "body": {
                            "src": "yrkie-asset-data://allowed",
                            "role": "background image",
                            "type": "generated_image",
                            "ratio": "16:9"
                        },
                        "describe": "左侧约60%留白，右侧约30%放置装饰。"
                    }
                }
            }]}}
        });

        let replacements = deterministic_fallback_replacements(&plan, &context).unwrap();
        crate::presentation::recovery::grounding::validate_page_replacement_provenance(
            &plan,
            &replacements,
            &context,
            crate::presentation::recovery::grounding::ReplacementProvenanceMode::Clean,
        )
        .expect("fallback must use only authoritative Outline body values");
        let rendered_text = replacements[0].slide["blocks"]
            .as_array()
            .unwrap()
            .iter()
            .filter_map(|block| block["props"]["text"].as_str())
            .collect::<Vec<_>>()
            .join("\n");
        assert!(rendered_text.starts_with("2026 年度工作汇报"));
        assert!(rendered_text.contains("星辰科技"));
        assert!(!rendered_text.contains("16:9"));
        assert!(!rendered_text.contains("60%"));
        assert!(!rendered_text.contains("30%"));
        assert!(!rendered_text.contains("封面主标题"));
    }

    #[test]
    fn deterministic_fallback_preserves_structured_number_display_equivalence() {
        let plan = broken_plan();
        let context = json!({
            "confirmed_outline": {"outline": {"slides": [{
                "page_number": 1,
                "contents": {
                    "section_title": {"body": "年度对比"},
                    "year_comparison": {"body": {
                        "type": "comparison",
                        "items": [
                            {"name": "FY2025", "values": [2168, 397, 1.0, 87]},
                            {"name": "FY2026", "values": [2860, 480, 1.28, 92]}
                        ],
                        "dimensions": ["营业总收入（万元）", "客户续约率（%）"]
                    }}
                }
            }]}}
        });

        let replacements = deterministic_fallback_replacements(&plan, &context).unwrap();
        crate::presentation::recovery::grounding::validate_page_replacement_provenance(
            &plan,
            &replacements,
            &context,
            crate::presentation::recovery::grounding::ReplacementProvenanceMode::Clean,
        )
        .expect("JSON number display formatting must remain grounded");
    }

    

    #[test]
    fn page_repair_request_contains_only_failed_outline_pages() {
        let plan = broken_plan();
        let context = json!({
            "confirmed_outline": {"outline": {"slides": [{"title": "Only page"}]}}
        });
        let request = page_repair_request(
            &plan,
            &context,
            SlideDeckExpectations::new(1).unwrap(),
            &[],
            SlideModelRepairMode::Clean,
        )
        .unwrap();
        let payload: Value = serde_json::from_str(&request.user_payload).unwrap();
        assert!(payload["failed_pages"][0].get("damaged_slide").is_none());
        assert_eq!(payload["failed_pages"].as_array().unwrap().len(), 1);
    }
