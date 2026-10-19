
    use super::*;
    use crate::presentation::schema::contract::SlideDeckExpectations;
    use crate::presentation::recovery::{plan_page_repairs, recover_agent_deck, SlidePageReplacement};
    use serde_json::json;

    fn recovered_deck(slide: Value) -> RecoveredSlideDeck {
        let deck = json!({
            "version": 4,
            "pageNumber": {"enabled": true, "format": "number"},
            "deck": {"title": "Test", "theme": "yrkie-theme", "slides": [slide]}
        });
        recover_agent_deck(
            &deck.to_string(),
            SlideDeckExpectations::new(1).unwrap(),
            &[],
        )
        .unwrap()
    }

    fn recovered(text: &str) -> RecoveredSlideDeck {
        recovered_deck(json!({
            "id": "slide-1",
            "size": {"width": 960, "height": 540, "unit": "pt"},
            "blocks": [{"id": "heading", "type": "heading", "props": {"text": text}}]
        }))
    }

    #[test]
    fn accepts_exact_normalized_outline_anchor_and_rejects_unrelated_page() {
        let context = json!({
            "confirmed_outline": {"outline": {"slides": [{
                "page_number": 1,
                "contents": {"title": {"body": "年度经营成果"}}
            }]}}
        });
        let accepted = evaluate(&recovered("年度经营成果：核心指标"), &context).unwrap();
        assert!(accepted.success);
        assert_eq!(accepted.pages[0].shared_anchor_count, 1);

        let rejected = evaluate(&recovered("完全不相关的页面"), &context).unwrap();
        assert!(!rejected.success);
        assert_eq!(rejected_diagnostics(&rejected).len(), 1);
    }

    #[test]
    fn rejects_protected_facts_absent_from_outline_and_delegation() {
        let context = json!({
            "delegation": {"user_request_summary": "制作年度经营成果汇报"},
            "confirmed_outline": {"outline": {"slides": [{
                "page_number": 1,
                "contents": {"title": {"body": "年度经营成果 2025"}}
            }]}}
        });
        let report = evaluate(&recovered("年度经营成果 2025，2026 年行业第一"), &context).unwrap();
        assert!(!report.success);
        assert_eq!(report.pages[0].unsupported_number_count, 1);
        assert!(rejected_diagnostics(&report)
            .iter()
            .any(|diagnostic| diagnostic.code == "outline.page_fact_unsupported"));

        let delegated = json!({
            "delegation": {"user_request_summary": "使用示例数据 2026"},
            "confirmed_outline": {"outline": {"slides": [{
                "page_number": 1,
                "contents": {"title": {"body": "年度经营成果 2025"}}
            }]}}
        });
        let report = evaluate(&recovered("年度经营成果 2025，示例数据 2026"), &delegated).unwrap();
        assert!(report.success);
    }

    #[test]
    fn visual_configuration_and_display_ordinals_are_not_business_facts() {
        let context = json!({
            "confirmed_outline": {"outline": {"slides": [{
                "page_number": 1,
                "contents": {
                    "title": {"body": "挑战与应对"},
                    "items": {"body": {"type": "strengths", "items": [
                        {"title": "市场竞争加剧", "text": "强化产品差异化价值"},
                        {"title": "交付资源紧张", "text": "完善标准化交付流程"}
                    ]}}
                }
            }]}}
        });
        let slide = recovered_deck(json!({
            "id": "slide-1",
            "size": {"width": 960, "height": 540, "unit": "pt"},
            "background": {"enabled": true, "overlay": {"opacity": 0.18}},
            "blocks": [
                {"id": "heading", "type": "heading", "props": {"text": "挑战与应对"}},
                {"id": "cards", "type": "numbered-icon-cards", "props": {
                    "itemColumns": 2,
                    "content": {"items": [
                        {"title": "市场竞争加剧", "text": "强化产品差异化价值", "icon": "target", "number": "01", "color": "#bd2d24", "strokeWidth": 2.2},
                        {"title": "交付资源紧张", "text": "完善标准化交付流程", "icon": "clock", "number": "02", "color": "#203754", "strokeWidth": 2.2}
                    ]}
                }},
                {"id": "agenda", "type": "list", "props": {"items": [
                    "01 · 市场竞争加剧",
                    "02 · 交付资源紧张"
                ]}}
            ]
        }));
        let report = evaluate(&slide, &context).unwrap();
        assert!(
            report.success,
            "visual controls must not become facts: {report:?}"
        );
        assert_eq!(report.pages[0].unsupported_number_count, 0);
    }

    #[test]
    fn equivalent_currency_units_match_across_outline_and_chart() {
        let context = json!({
            "confirmed_outline": {"outline": {"slides": [{
                "page_number": 1,
                "contents": {
                    "title": {"body": "近五年营业收入趋势"},
                    "comparison": {"body": {
                        "type": "comparison",
                        "dimensions": ["营业收入（亿元）"],
                        "items": [
                            {"name": "2024年", "values": [0.92]},
                            {"name": "2025年", "values": [1.35]}
                        ]
                    }}
                }
            }]}}
        });
        let slide = recovered_deck(json!({
            "id": "slide-1",
            "size": {"width": 960, "height": 540, "unit": "pt"},
            "blocks": [
                {"id": "heading", "type": "heading", "props": {"text": "近五年营业收入趋势"}},
                {"id": "chart", "type": "line-chart", "props": {"content": {
                    "categories": ["2024年", "2025年"],
                    "series": [{"name": "营业收入（万元）", "data": [9200, 13500]}]
                }}}
            ]
        }));
        let report = evaluate(&slide, &context).unwrap();
        assert!(
            report.success,
            "equivalent currency units must match: {report:?}"
        );
        assert_eq!(report.pages[0].unsupported_number_count, 0);
    }

    #[test]
    fn structured_outline_value_and_unit_match_formatted_slide_value() {
        let context = json!({
            "confirmed_outline": {"outline": {"slides": [{
                "page_number": 1,
                "contents": {
                    "title": {"body": "年度业绩总览"},
                    "metrics": {"body": {"type": "metrics", "items": [
                        {"label": "客户续约率", "value": 87, "unit": "%", "period": "2025年度"},
                        {"label": "净利润", "value": 4210, "unit": "万元", "period": "2025年度"}
                    ]}}
                }
            }]}}
        });
        let slide = recovered_deck(json!({
            "id": "slide-1",
            "size": {"width": 960, "height": 540, "unit": "pt"},
            "blocks": [
                {"id": "heading", "type": "heading", "props": {"text": "年度业绩总览"}},
                {"id": "stats", "type": "layout-group", "kind": "collection", "layout": {}, "children": [
                    {"id": "renewal", "type": "stat", "props": {"value": "87.0%", "label": "客户续约率", "description": "2025年度"}},
                    {"id": "profit", "type": "stat", "props": {"value": "4,210万元", "label": "净利润", "description": "2025年度"}}
                ]}
            ]
        }));
        let report = evaluate(&slide, &context).unwrap();
        assert!(
            report.success,
            "value/unit formatting must be equivalent: {report:?}"
        );
        assert_eq!(report.pages[0].unsupported_number_count, 0);
    }

    #[test]
    fn genuinely_new_business_numbers_are_still_rejected() {
        let context = json!({
            "confirmed_outline": {"outline": {"slides": [{
                "page_number": 1,
                "contents": {
                    "title": {"body": "年度业绩总览"},
                    "metrics": {"body": {"type": "metrics", "items": [
                        {"label": "客户续约率", "value": 87, "unit": "%"}
                    ]}}
                }
            }]}}
        });
        let report = evaluate(&recovered("年度业绩总览，客户续约率 99%"), &context).unwrap();
        assert!(!report.success);
        assert_eq!(report.pages[0].unsupported_number_count, 1);
    }

    #[test]
    fn page_replacement_provenance_blocks_invented_numbers_urls_and_quotes() {
        let broken = json!({
            "version": 4,
            "pageNumber": {"enabled": true, "format": "number"},
            "deck": {"title": "Test", "theme": "yrkie-theme", "slides": [{
                "id": "slide-1",
                "size": {"width": 960, "height": 540, "unit": "pt"},
                "blocks": [{"id": "heading", "type": "heading", "props": {}}]
            }]}
        });
        let plan = plan_page_repairs(
            &broken.to_string(),
            SlideDeckExpectations::new(1).unwrap(),
            &[],
        )
        .unwrap();
        let context = json!({
            "confirmed_outline": {"outline": {"slides": [{
                "page_number": 1,
                "contents": {"title": {"body": "年度经营成果 2025"}}
            }]}}
        });
        let replacement = |text: &str, node_type: &str| SlidePageReplacement {
            page_index: 0,
            expected_page_sha256: plan.targets[0].page_sha256.clone(),
            slide: json!({
                "id": "slide-1",
                "size": {"width": 960, "height": 540, "unit": "pt"},
                "blocks": [{"id": "content", "type": node_type, "props": {"text": text}}]
            }),
        };
        validate_page_replacement_provenance(
            &plan,
            &[replacement("年度经营成果 2025", "heading")],
            &context,
            ReplacementProvenanceMode::Clean,
        )
        .unwrap();
        assert!(validate_page_replacement_provenance(
            &plan,
            &[replacement("年度经营成果 2026", "heading")],
            &context,
            ReplacementProvenanceMode::Clean,
        )
        .unwrap_err()
        .starts_with("slide_recovery_provenance_number_unsupported"));
        assert!(validate_page_replacement_provenance(
            &plan,
            &[replacement("https://invented.example.com", "heading")],
            &context,
            ReplacementProvenanceMode::Clean,
        )
        .unwrap_err()
        .starts_with("slide_recovery_provenance_url_unsupported"));
        assert!(validate_page_replacement_provenance(
            &plan,
            &[replacement("未经证实的引语", "quote")],
            &context,
            ReplacementProvenanceMode::Clean,
        )
        .unwrap_err()
        .starts_with("slide_recovery_provenance_attribution_unsupported"));
        assert!(validate_page_replacement_provenance(
            &plan,
            &[replacement("年度经营成果 2025 同比表现行业第一", "heading")],
            &context,
            ReplacementProvenanceMode::Clean,
        )
        .unwrap_err()
        .starts_with("slide_recovery_provenance_text_unsupported"));

        let mut damaged = replacement("原页可保留陈述", "heading");
        let mut targeted_plan = plan.clone();
        targeted_plan.targets[0].slide = damaged.slide.clone();
        damaged.expected_page_sha256 = targeted_plan.targets[0].page_sha256.clone();
        validate_page_replacement_provenance(
            &targeted_plan,
            &[damaged],
            &context,
            ReplacementProvenanceMode::Targeted,
        )
        .expect("targeted repair may preserve an existing business string exactly");

        let synthetic_context = json!({
            "factual_claim_policy": "explicit_synthetic_data_allowed",
            "confirmed_outline": {"outline": {"slides": [{
                "page_number": 1,
                "contents": {"title": {"body": "年度经营成果 2025"}}
            }]}}
        });
        validate_page_replacement_provenance(
            &plan,
            &[replacement("年度经营成果 2025 示例数据 2026", "heading")],
            &synthetic_context,
            ReplacementProvenanceMode::Clean,
        )
        .expect("explicitly authorized and visibly labeled synthetic numbers are allowed");
        assert!(validate_page_replacement_provenance(
            &plan,
            &[replacement("年度经营成果 2025 2026", "heading")],
            &synthetic_context,
            ReplacementProvenanceMode::Clean,
        )
        .unwrap_err()
        .starts_with("slide_recovery_provenance_number_unsupported"));
    }
