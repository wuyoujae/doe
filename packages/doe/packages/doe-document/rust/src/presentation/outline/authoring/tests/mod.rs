
    use super::*;
    use std::fs;

    fn valid_output(operation: &str, revision: Value) -> Value {
        json!({
            "operation": operation,
            "expected_revision": revision,
            "outline": {
                "slides": [{
                    "page_number": 1,
                    "contents": {
                        "title": {"body": "Hello", "describe": "Cover title"}
                    }
                }]
            }
        })
    }

    #[test]
    fn request_contract_removes_provider_structured_output_and_keeps_runtime_policy() {
        let mut other = Some(json!({
            "parallelToolCalls": true,
            "parallel_tool_calls": true,
            "maxTokens": 1_000_000,
            "max_tokens": 1_000_000,
            "plugins": [{"id": "untrusted"}],
            "reasoning_effort": "high",
            "reasoningEffort": "high",
            "include_reasoning": true,
            "reasoning": {"effort": "high", "exclude": false},
            "response_format": {"type": "text"},
            "responseFormat": {"type": "json_object"},
            "provider": {
                "require_parameters": true,
                "allow_fallbacks": false,
                "order": ["Inceptron"],
                "ignore": ["custom", "OPEN-INFERENCE"]
            }
        }));
        apply_request_contract(&mut other, true, Some(32_768), "low").unwrap();
        let other = other.unwrap();
        assert!(other.get("response_format").is_none());
        assert!(other.get("responseFormat").is_none());
        assert!(other["provider"].get("require_parameters").is_none());
        assert_eq!(other["provider"]["allow_fallbacks"], true);
        assert_eq!(
            other["provider"]["order"],
            json!([
                "DeepInfra",
                "Fireworks",
                "Together",
                "Cloudflare",
                "AkashML"
            ])
        );
        assert_eq!(
            other["provider"]["ignore"],
            json!(["custom", "OPEN-INFERENCE", "parasail", "baidu"])
        );
        assert_eq!(other["maxTokens"], 32_768);
        assert!(other.get("max_tokens").is_none());
        assert_eq!(
            other["reasoning"],
            json!({"effort": "low", "exclude": false})
        );
        assert!(other.get("reasoning_effort").is_none());
        assert!(other.get("reasoningEffort").is_none());
        assert!(other.get("include_reasoning").is_none());
        assert!(other.get("plugins").is_none());
        assert!(other.get("parallelToolCalls").is_none());
        assert!(other.get("parallel_tool_calls").is_none());
    }

    #[test]
    fn request_contract_without_openrouter_also_removes_structured_output() {
        let mut other = Some(json!({"plugins": [{"id": "untrusted"}]}));
        apply_request_contract(&mut other, false, None, "medium").unwrap();
        let other = other.unwrap();

        assert!(other.get("plugins").is_none());
        assert!(other.get("response_format").is_none());
        assert_eq!(other["maxTokens"], DEFAULT_MAX_OUTPUT_TOKENS);
    }

    

    

    

    

    

    

    

    

    #[test]
    fn streamed_content_accounting_covers_streaming_and_non_streaming_responses() {
        assert_eq!(
            streamed_content_bytes(&json!({
                "choices": [
                    {"delta": {"content": "one"}},
                    {"delta": {"content": "二"}}
                ]
            })),
            "one".len() + "二".len()
        );
        assert_eq!(
            streamed_content_bytes(&json!({
                "choices": [{"message": {"content": "complete"}}]
            })),
            "complete".len()
        );
    }

    #[test]
    fn parses_create_and_requires_revision_for_mutations() {
        let parsed = parse_and_validate(&valid_output("create", Value::Null).to_string()).unwrap();
        assert_eq!(parsed.operation, OutlineOperation::Create);
        assert_eq!(parsed.expected_revision, None);
        assert!(parse_and_validate(&valid_output("edit", Value::Null).to_string()).is_err());
        assert!(parse_and_validate(&valid_output("create", json!(1)).to_string()).is_err());
    }

    #[test]
    fn accepts_canonical_multi_slide_contents_without_double_encoding() {
        let output = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {
                "slides": [
                    {
                        "page_number": 1,
                        "contents": {
                            "title": {
                                "body": "Brain-computer interfaces",
                                "describe": "Cover title."
                            }
                        }
                    },
                    {
                        "page_number": 2,
                        "contents": {
                            "challenges": {
                                "body": {
                                    "type": "strengths",
                                    "items": [
                                        {"title": "Signal stability", "text": "Long-term decoding remains difficult."},
                                        {"title": "Privacy", "text": "Neural data requires strict safeguards."}
                                    ]
                                },
                                "describe": "Two substantive challenges."
                            }
                        }
                    }
                ]
            }
        });

        let parsed = parse_and_validate(&output.to_string()).expect("canonical Outline output");
        assert_eq!(parsed.syntax_repair_count, 0);
        assert_eq!(parsed.outline.slides.as_ref().unwrap().len(), 2);
        let canonical: Value = serde_json::from_str(&parsed.canonical_json).unwrap();
        assert!(canonical["outline"]["slides"]
            .as_array()
            .unwrap()
            .iter()
            .all(|slide| slide.get("contents_json").is_none()));
    }

    #[test]
    fn decodes_provider_wire_contents_json_into_canonical_v2_contents() {
        let wire = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {
                "slides": [{
                    "page_number": 1,
                    "contents_json": serde_json::to_string(&json!({
                        "key_message": {
                            "body": "Structured output works",
                            "describe": "The page's core message."
                        }
                    })).unwrap()
                }]
            }
        });
        let parsed = parse_and_validate(&wire.to_string()).expect("valid Provider wire output");
        let canonical: Value = serde_json::from_str(&parsed.canonical_json).unwrap();
        assert_eq!(
            canonical["outline"]["slides"][0]["contents"]["key_message"]["body"],
            "Structured output works"
        );
        assert!(canonical["outline"]["slides"][0]
            .get("contents_json")
            .is_none());
        assert_eq!(parsed.syntax_repair_count, 0);
        assert_eq!(parsed.image_type_repair_count, 0);
        assert_eq!(parsed.missing_generated_image_type_repair_count, 0);
        assert_eq!(parsed.blank_paragraph_repair_count, 0);
        assert_eq!(parsed.ignored_unknown_field_count, 0);
    }

    #[test]
    fn ignores_unknown_transport_fields_before_canonical_validation() {
        let wire = json!({
            "operation": "create",
            "expected_revision": null,
            "request_debug": {"provider": "ignored"},
            "outline": {
                "page_count_hint": null,
                "slides": [{
                    "page_number": 1,
                    "contents_json": serde_json::to_string(&json!({
                        "title": {
                            "body": "Python loops",
                            "describe": "Cover title."
                        }
                    })).unwrap()
                }]
            }
        });

        let parsed = parse_and_validate(&wire.to_string()).expect("ignorable extra fields");
        let canonical: Value = serde_json::from_str(&parsed.canonical_json).unwrap();

        assert_eq!(parsed.ignored_unknown_field_count, 2);
        assert!(canonical.get("request_debug").is_none());
        assert!(canonical["outline"].get("page_count_hint").is_none());
        assert_eq!(
            canonical["outline"]["slides"][0]["contents"]["title"]["body"],
            "Python loops"
        );
    }

    #[test]
    fn rejects_unknown_standard_component_fields_instead_of_discarding_business_data() {
        let wire = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": [{
                "page_number": 1,
                "contents_json": serde_json::to_string(&json!({
                    "title": {
                        "body": "Known body",
                        "describe": "Known description.",
                        "layout_hint": "discard"
                    },
                    "summary": {
                        "body": {"type": "text_block", "paragraphs": ["A"], "tone": "discard"},
                        "describe": "Text block."
                    },
                    "metric": {
                        "body": {"type": "metric", "label": "Accuracy", "value": 95, "debug": true},
                        "describe": "Metric."
                    },
                    "metrics": {
                        "body": {
                            "type": "metrics",
                            "items": [{"label": "Users", "value": 10, "title_desc": "discard"}],
                            "columns": 2
                        },
                        "describe": "Metrics."
                    },
                    "timeline": {
                        "body": {
                            "type": "timeline",
                            "events": [{"time": "2026", "title": "Launch", "detail": "Done", "icon": "discard"}],
                            "style": "discard"
                        },
                        "describe": "Timeline."
                    },
                    "process": {
                        "body": {
                            "type": "process",
                            "steps": [{"order": 1, "title": "Start", "detail": "Run", "duration": "discard"}],
                            "direction": "discard"
                        },
                        "describe": "Process."
                    },
                    "strengths": {
                        "body": {
                            "type": "strengths",
                            "items": [{"title": "Safe", "text": "Works", "title_desc": "discard"}],
                            "layout": "discard"
                        },
                        "describe": "Strengths."
                    },
                    "comparison": {
                        "body": {
                            "type": "comparison",
                            "dimensions": ["A"],
                            "items": [{"name": "One", "values": [1], "note": "discard"}],
                            "legend": "discard"
                        },
                        "describe": "Comparison."
                    },
                    "table": {
                        "body": {
                            "type": "table",
                            "columns": [{"key": "name", "label": "Name", "width": "discard"}],
                            "rows": [{"name": "Alice", "unknown_cell": "discard"}],
                            "caption": "discard"
                        },
                        "describe": "Table."
                    },
                    "cards": {
                        "body": {
                            "type": "illustrated_items",
                            "items": [
                                {
                                    "title": "One",
                                    "text": "First",
                                    "image": {"type": "image", "src": "https://example.com/1.png", "ratio": "1:1", "role": "item", "alt": "discard"},
                                    "badge": "discard"
                                },
                                {
                                    "title": "Two",
                                    "text": "Second",
                                    "image": {"type": "image", "src": "https://example.com/2.png", "ratio": "1:1", "role": "item", "alt": "discard"},
                                    "badge": "discard"
                                }
                            ],
                            "gap": 12
                        },
                        "describe": "Cards."
                    },
                    "hero_image": {
                        "body": {"type": "image", "src": "https://example.com/hero.png", "ratio": "16:9", "role": "hero", "credit": "discard"},
                        "describe": "Hero image."
                    }
                })).unwrap()
            }]}
        });

        let error = parse_and_validate(&wire.to_string())
            .expect_err("unknown business fields require semantic repair");
        assert!(error.starts_with(OUTPUT_CONTRACT_VIOLATION_ERROR));
    }

    #[test]
    fn unknown_fields_do_not_hide_missing_or_ambiguous_required_content() {
        let missing_slides = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"page_count_hint": 12}
        });
        assert!(parse_and_validate(&missing_slides.to_string()).is_err());

        let ambiguous_contents = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": [{
                "page_number": 1,
                "contents": {"title": {"body": "A", "describe": "Title."}},
                "contents_json": "{\"title\":{\"body\":\"B\",\"describe\":\"Title.\"}}",
                "page_type": "cover"
            }]}
        });
        assert!(parse_and_validate(&ambiguous_contents.to_string()).is_err());
    }

    #[test]
    fn malformed_multibyte_wire_output_returns_a_stable_error_without_panicking() {
        let raw = r#"{"operation":"create","expected_revision":null,"outline":{"slides":[{"page_number":1,"contents_json":"{\"title\":{\"body\":\"中文句号。\",\"describe\":\"标题。\"}} 天的PPT大纲架构严密...}]}}"#;

        let error = parse_and_validate_safely(raw).expect_err("malformed wire output");
        assert!(error.starts_with(INVALID_JSON_ERROR), "{error}");
        assert!(!error.contains(raw));
    }

    #[test]
    fn unknown_process_text_does_not_replace_required_detail() {
        let wire = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": [{
                "page_number": 1,
                "contents_json": serde_json::to_string(&json!({
                    "allocation": {
                        "body": {
                            "type": "process",
                            "steps": [{"order": 1, "title": "投入", "text": "不应猜成 detail"}]
                        },
                        "describe": "资金分配流程。"
                    }
                })).unwrap()
            }]}
        });

        let error = parse_and_validate_safely(&wire.to_string()).expect_err("missing detail");
        assert!(error.starts_with(OUTPUT_CONTRACT_VIOLATION_ERROR));
        assert!(error.contains(".steps[0].text is not allowed for this component"));
    }

    #[test]
    fn removes_only_blank_text_block_paragraphs_before_validation() {
        let wire = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": [{
                "page_number": 1,
                "contents_json": serde_json::to_string(&json!({
                    "syntax_explanation": {
                        "body": {
                            "type": "text_block",
                            "paragraphs": [
                                "for item in items:",
                                "    println!(\"{item}\");",
                                "",
                                " \n\t ",
                                "The indentation above must be preserved."
                            ]
                        },
                        "describe": "A code example with a visual paragraph separator."
                    }
                })).unwrap()
            }]}
        });

        let parsed = parse_and_validate(&wire.to_string()).expect("repairable blank paragraphs");
        let canonical: Value = serde_json::from_str(&parsed.canonical_json).unwrap();
        assert_eq!(parsed.blank_paragraph_repair_count, 2);
        assert_eq!(
            canonical["outline"]["slides"][0]["contents"]["syntax_explanation"]["body"]
                ["paragraphs"],
            json!([
                "for item in items:",
                "    println!(\"{item}\");",
                "The indentation above must be preserved."
            ])
        );
    }

    #[test]
    fn rejects_text_blocks_that_are_empty_after_blank_paragraph_repair() {
        let wire = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": [{
                "page_number": 1,
                "contents_json": serde_json::to_string(&json!({
                    "notes": {
                        "body": {
                            "type": "text_block",
                            "paragraphs": ["", " \n\t "]
                        },
                        "describe": "Blank-only content must not be invented by the backend."
                    }
                })).unwrap()
            }]}
        });

        let error = parse_and_validate(&wire.to_string()).expect_err("empty text block");
        assert!(error.starts_with(OUTPUT_CONTRACT_VIOLATION_ERROR));
        assert!(error.contains(
            "outline.slides[0].contents.notes.body.paragraphs has an invalid number of items"
        ));
    }

    #[test]
    fn does_not_remove_blank_values_from_semantic_arrays() {
        let wire = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": [{
                "page_number": 1,
                "contents_json": serde_json::to_string(&json!({
                    "quarterly_comparison": {
                        "body": {
                            "type": "comparison",
                            "dimensions": ["Q1", ""],
                            "items": [{"name": "Revenue", "values": [10, 12]}]
                        },
                        "describe": "A blank dimension remains a real schema error."
                    }
                })).unwrap()
            }]}
        });

        let error = parse_and_validate(&wire.to_string()).expect_err("blank dimension");
        assert!(error.contains(
            "outline.slides[0].contents.quarterly_comparison.body.dimensions[1] must not be empty"
        ));
    }

    #[test]
    fn bounds_blank_paragraph_repairs_for_the_complete_outline() {
        let mut contents = Map::new();
        for index in 0..65 {
            contents.insert(
                format!("section_{index}"),
                json!({
                    "body": {
                        "type": "text_block",
                        "paragraphs": ["", " \t ", format!("Content {index}")]
                    },
                    "describe": format!("Section {index}.")
                }),
            );
        }
        let wire = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": [{
                "page_number": 1,
                "contents_json": serde_json::to_string(&Value::Object(contents)).unwrap()
            }]}
        });

        let error = parse_and_validate(&wire.to_string()).expect_err("repair limit");
        assert!(error.contains(&format!(
            "semantic repair count exceeded {MAX_SEMANTIC_REPAIRS_PER_OUTLINE}"
        )));
    }

    #[test]
    fn repairs_only_generated_image_markers_misclassified_as_direct_images() {
        let marker = "GENRATEIMG(4:3 business chart, no text or watermark)";
        let wire = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": [{
                "page_number": 1,
                "contents_json": serde_json::to_string(&json!({
                    "advertising_trend": {
                        "body": {
                            "type": "image",
                            "src": marker,
                            "ratio": "4:3",
                            "role": "content image | advertising trend"
                        },
                        "describe": "Advertising revenue trend chart."
                    },
                    "direct_image": {
                        "body": {
                            "type": "image",
                            "src": "https://images.unsplash.com/photo-1",
                            "ratio": "16:9",
                            "role": "content image | direct source"
                        },
                        "describe": "A direct network image."
                    }
                })).unwrap()
            }]}
        });

        let parsed = parse_and_validate(&wire.to_string()).expect("repairable image type");
        let canonical: Value = serde_json::from_str(&parsed.canonical_json).unwrap();
        assert_eq!(parsed.image_type_repair_count, 1);
        assert_eq!(
            canonical["outline"]["slides"][0]["contents"]["advertising_trend"]["body"]["type"],
            "generated_image"
        );
        assert_eq!(
            canonical["outline"]["slides"][0]["contents"]["direct_image"]["body"]["type"],
            "image"
        );
    }

    #[test]
    fn repairs_missing_generated_image_type_only_in_illustrated_item_image_slots() {
        let wire = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": [{
                "page_number": 1,
                "contents": {
                    "application_items": {
                        "body": {
                            "type": "illustrated_items",
                            "items": [
                                {
                                    "title": "专注倾听",
                                    "text": "让信息被完整接收",
                                    "image": {
                                        "type": "generated_image",
                                        "src": "GENRATEIMG(专注倾听的团队成员)",
                                        "ratio": "1:1",
                                        "role": "supporting"
                                    }
                                },
                                {
                                    "title": "沟通交流",
                                    "text": "促进团队信息同步",
                                    "image": {
                                        "body": null,
                                        "src": "GENRATEIMG(沟通交流的团队场景)",
                                        "ratio": "1:1",
                                        "role": "supporting"
                                    }
                                }
                            ]
                        },
                        "describe": "Two communication practices with supporting images."
                    }
                }
            }]}
        });

        let parsed = parse_and_validate(&wire.to_string()).expect("repair production shape");
        let canonical: Value = serde_json::from_str(&parsed.canonical_json).unwrap();
        let repaired = &canonical["outline"]["slides"][0]["contents"]["application_items"]["body"]
            ["items"][1]["image"];

        assert_eq!(parsed.missing_generated_image_type_repair_count, 1);
        assert_eq!(parsed.image_type_repair_count, 0);
        assert_eq!(repaired["type"], "generated_image");
        assert!(repaired.get("body").is_none());
        assert_eq!(repaired["src"], "GENRATEIMG(沟通交流的团队场景)");

        let malformed =
            wire.to_string()
                .replacen("\"body\":null,\"src\"", "\"body\":null\"src\"", 1);
        let repaired_after_syntax =
            parse_and_validate(&malformed).expect("syntax and semantic repair compose");
        assert_eq!(repaired_after_syntax.syntax_repair_count, 1);
        assert_eq!(
            repaired_after_syntax.missing_generated_image_type_repair_count,
            1
        );
    }

    #[test]
    fn rejects_ambiguous_missing_image_types_instead_of_guessing() {
        let invalid_images = [
            json!({
                "body": {"caption": "must survive"},
                "src": "GENRATEIMG(沟通交流)",
                "ratio": "1:1",
                "role": "supporting"
            }),
            json!({
                "body": null,
                "src": "https://images.example.com/team.png",
                "ratio": "1:1",
                "role": "supporting"
            }),
            json!({
                "body": null,
                "src": "GENRATEIMG(",
                "ratio": "1:1",
                "role": "supporting"
            }),
            json!({
                "body": null,
                "src": "GENRATEIMG(沟通交流)",
                "ratio": "2:1",
                "role": "supporting"
            }),
            json!({
                "body": null,
                "src": "GENRATEIMG(沟通交流)",
                "ratio": "1:1",
                "role": "supporting",
                "unexpected": true
            }),
        ];

        for invalid_image in invalid_images {
            let wire = json!({
                "operation": "create",
                "expected_revision": null,
                "outline": {"slides": [{
                    "page_number": 1,
                    "contents": {
                        "application_items": {
                            "body": {
                                "type": "illustrated_items",
                                "items": [
                                    {
                                        "title": "专注倾听",
                                        "text": "让信息被完整接收",
                                        "image": {
                                            "type": "generated_image",
                                            "src": "GENRATEIMG(专注倾听)",
                                            "ratio": "1:1",
                                            "role": "supporting"
                                        }
                                    },
                                    {
                                        "title": "沟通交流",
                                        "text": "促进团队信息同步",
                                        "image": invalid_image
                                    }
                                ]
                            },
                            "describe": "Two communication practices."
                        }
                    }
                }]}
            });

            let error = parse_and_validate(&wire.to_string()).expect_err("ambiguous image shape");
            assert!(error.contains("application_items.body.items[1].image"));
        }
    }

    #[test]
    fn does_not_repair_a_similar_object_outside_an_image_slot() {
        let wire = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": [{
                "page_number": 1,
                "contents": {
                    "ambiguous_component": {
                        "body": {
                            "body": null,
                            "src": "GENRATEIMG(沟通交流)",
                            "ratio": "1:1",
                            "role": "supporting"
                        },
                        "describe": "This is not a declared image slot."
                    }
                }
            }]}
        });

        let error = parse_and_validate(&wire.to_string()).expect_err("unknown component shape");
        assert!(error.contains("ambiguous_component.body.type"));
    }

    #[test]
    fn bounds_missing_generated_image_type_repairs_for_the_complete_outline() {
        let slides = (1..=doe_core::asset::generated::MAX_OUTLINE_GENERATED_IMAGES + 1)
            .map(|page_number| {
                json!({
                    "page_number": page_number,
                    "contents": {
                        "application_items": {
                            "body": {
                                "type": "illustrated_items",
                                "items": [
                                    {
                                        "title": "沟通交流",
                                        "text": "促进团队信息同步",
                                        "image": {
                                            "body": null,
                                            "src": format!("GENRATEIMG(团队沟通场景 {page_number})"),
                                            "ratio": "1:1",
                                            "role": "supporting"
                                        }
                                    },
                                    {
                                        "title": "协同决策",
                                        "text": "围绕同一目标行动",
                                        "image": {
                                            "type": "image",
                                            "src": "https://images.example.com/team.png",
                                            "ratio": "1:1",
                                            "role": "supporting"
                                        }
                                    }
                                ]
                            },
                            "describe": "Two communication practices."
                        }
                    }
                })
            })
            .collect::<Vec<_>>();
        let wire = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": slides}
        });

        let error = parse_and_validate(&wire.to_string()).expect_err("repair budget");
        assert!(error.contains(&format!(
            "Outline cannot contain more than {} generated images",
            doe_core::asset::generated::MAX_OUTLINE_GENERATED_IMAGES
        )));
    }

    #[test]
    #[ignore = "set YRKIE_OUTLINE_AGENT_OUTPUT_SAMPLE to replay a local Provider response"]
    fn validates_external_outline_agent_output_sample() {
        let path = std::env::var("YRKIE_OUTLINE_AGENT_OUTPUT_SAMPLE")
            .expect("YRKIE_OUTLINE_AGENT_OUTPUT_SAMPLE path");
        let raw = fs::read_to_string(path).expect("read Outline Agent output sample");

        parse_and_validate_safely(&raw).expect("valid external Outline Agent output sample");
    }

    #[test]
    fn accepts_the_incident_shape_with_one_fenced_outline_after_provider_prose() {
        let raw = r#"我来为您构建一份完整的公司年终汇报PPT大纲，使用 Mock 数据。

```json
{"operation":"create","expected_revision":null,"outline":{"slides":[{"page_number":1,"contents":{"title":{"body":"星曜科技 2026 年度经营汇报","describe":"封面标题"},"metric":{"body":{"type":"metrics","items":[{"label":"年度营业收入","value":2.86,"unit":"亿元","period":"FY2026","comparison":"同比增长38%"}]},"describe":"明确标注为 Mock 数据"}}}]}}
```"#;
        let parsed = parse_and_validate_safely(raw).expect("incident provider response");

        assert_eq!(parsed.outline.slides.as_ref().map(Vec::len), Some(1));
        assert_eq!(
            parsed.outline.slides.as_ref().unwrap()[0].contents["title"]["body"],
            "星曜科技 2026 年度经营汇报"
        );
        assert!(parsed
            .diagnostic_report
            .findings
            .iter()
            .any(|finding| finding.code == "framing.wrapper.removed"));
    }

    #[test]
    fn accepts_a_single_series_comparison_across_multiple_dimensions() {
        let wire = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": [{
                "page_number": 1,
                "contents_json": serde_json::to_string(&json!({
                    "quarterly_comparison": {
                        "body": {
                            "type": "comparison",
                            "dimensions": ["Q1", "Q2", "Q3", "Q4"],
                            "items": [{
                                "name": "2026",
                                "values": [32.5, 35.8, 39.2, 46.2]
                            }]
                        },
                        "describe": "Quarterly revenue trend."
                    }
                })).unwrap()
            }]}
        });

        let parsed = parse_and_validate(&wire.to_string()).expect("single-series comparison");
        assert_eq!(parsed.outline.slides.as_ref().unwrap().len(), 1);
    }

    #[test]
    fn repairs_the_real_multi_slide_extra_closing_brace_shape() {
        let slides = (1..=13)
            .map(|page_number| {
                let valid_contents = json!({
                    "title": {
                        "body": format!("Page {page_number}"),
                        "describe": "Page title."
                    }
                })
                .to_string();
                json!({
                    "page_number": page_number,
                    "contents_json": format!("{valid_contents}}}")
                })
            })
            .collect::<Vec<_>>();
        let wire = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": slides}
        });

        let parsed = parse_and_validate(&wire.to_string()).expect("repairable wire output");
        assert_eq!(parsed.syntax_repair_count, 13);
        assert_eq!(parsed.outline.slides.as_ref().unwrap().len(), 13);
        let canonical: Value = serde_json::from_str(&parsed.canonical_json).unwrap();
        assert!(canonical["outline"]["slides"]
            .as_array()
            .unwrap()
            .iter()
            .all(|slide| slide.get("contents_json").is_none()));
    }

    #[test]
    fn replays_session_20db_repeated_slide_boundary_incident() {
        let raw =
            include_str!("../../recovery/fixtures/session-20db35735d9c6cbaa77426c4330d4480.json");
        let parsed = parse_and_validate(raw).expect("production incident fixture must recover");
        assert_eq!(parsed.syntax_repair_count, 7);
        assert_eq!(parsed.outline.slides.as_ref().map(Vec::len), Some(8));
        assert!(parsed.repair_proof.business_string_invariant_passed);
        assert!(parsed.repair_proof.canonicalization_idempotent);
    }

    #[test]
    fn repairs_only_bounded_delimiters_and_trailing_commas() {
        let cases = [
            (
                "{\"title\":{\"body\":\"Hello\",\"describe\":\"Cover title\"",
                2,
            ),
            (
                "{\"title\":{\"body\":\"Hello\",\"describe\":\"Cover title\",},}",
                2,
            ),
        ];
        for (contents_json, expected_repairs) in cases {
            let wire = json!({
                "operation": "create",
                "expected_revision": null,
                "outline": {"slides": [{
                    "page_number": 1,
                    "contents_json": contents_json
                }]}
            });
            let parsed = parse_and_validate(&wire.to_string()).expect("simple syntax repair");
            assert_eq!(parsed.syntax_repair_count, expected_repairs);
            assert_eq!(parsed.outline.slides.as_ref().unwrap().len(), 1);
        }

        let outer = format!("{}}}", valid_output("create", Value::Null));
        let parsed = parse_and_validate(&outer).expect("one extra outer delimiter");
        assert_eq!(parsed.syntax_repair_count, 1);
    }

    #[test]
    fn repairs_common_json_syntax_but_rejects_semantically_invalid_results() {
        let repairable_contents = [
            "{\"title\":{\"body\":\"Hello\" \"describe\":\"Cover title\"}}",
            "{\"title\":{\"body\":\"Hello\nworld\",\"describe\":\"Cover title\"}}",
            "{\"title\":{\"body\":\"Hello\",\"describe\":\"Cover title\"}}}}}}}",
        ];
        for contents_json in repairable_contents {
            let wire = json!({
                "operation": "create",
                "expected_revision": null,
                "outline": {"slides": [{
                    "page_number": 1,
                    "contents_json": contents_json
                }]}
            });
            let parsed = parse_and_validate(&wire.to_string()).expect("repairable syntax");
            assert!(parsed.syntax_repair_count > 0);
            assert_eq!(parsed.outline.slides.as_ref().unwrap().len(), 1);
        }

        let repairable_but_invalid = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": [{
                "page_number": 1,
                "contents_json": "{\"title\":{\"body\":\"Hello\"}}}"
            }]}
        });
        assert!(parse_and_validate(&repairable_but_invalid.to_string()).is_err());
    }

    #[test]
    fn repairs_the_real_eight_page_nested_delimiter_and_outer_quote_incident() {
        let slides = (1..=8)
            .map(|page_number| {
                let contents = if page_number == 6 {
                    json!({
                        "application_cards": {
                            "body": {
                                "type": "strengths",
                                "items": [{"title": "人机共生", "text": "AI 与脑机接口协同"}]
                            },
                            "describe": "第六页应用场景。"
                        }
                    })
                    .to_string()
                    .replacen(
                        "\"AI 与脑机接口协同\"}]",
                        "\"AI 与脑机接口协同\"]",
                        1,
                    )
                } else if page_number == 7 {
                    json!({
                        "challenges": {
                            "body": {
                                "type": "strengths",
                                "items": [{
                                    "title": "神经隐私",
                                    "text": "建立严格的数据保护边界。",
                                    "title_desc": "模型生成但系统不消费的附加字段"
                                }]
                            },
                            "describe": "第七页挑战。"
                        }
                    })
                    .to_string()
                } else {
                    json!({
                        "title": {
                            "body": format!("第 {page_number} 页"),
                            "describe": "页面标题。"
                        }
                    })
                    .to_string()
                };
                json!({"page_number": page_number, "contents_json": contents})
            })
            .collect::<Vec<_>>();
        let mut raw = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": slides}
        })
        .to_string();
        let final_contents_quote = raw.rfind("\"}]}}").expect("final contents_json boundary");
        raw.remove(final_contents_quote);

        let error = parse_and_validate(&raw)
            .expect_err("syntax is recoverable but unknown business content must be preserved");
        assert!(error.starts_with(OUTPUT_CONTRACT_VIOLATION_ERROR));
        assert!(error.contains("title_desc"));
    }

    #[test]
    fn unwraps_one_json_fence_with_harmless_prose_and_rejects_ambiguous_documents() {
        let valid = valid_output("create", Value::Null).to_string();
        for (opening, closing) in [
            ("```json", "```"),
            ("```JSON", "```"),
            ("```", "```"),
            ("~~~~json", "~~~~"),
        ] {
            let fenced = format!("{opening}\r\n{valid}\r\n{closing}");
            let parsed = parse_and_validate(&fenced).expect("single fenced JSON document");
            assert_eq!(parsed.outline.slides.as_ref().unwrap().len(), 1);
        }

        for wrapped in [
            format!("Explanation\n```json\n{valid}\n```"),
            format!("```json\n{valid}\n```\nExplanation"),
        ] {
            parse_and_validate(&wrapped).expect("unique fenced document with prose wrapper");
        }

        for rejected in [
            format!("```javascript\n{valid}\n```"),
            format!("```json\n{valid}\n~~~~"),
            format!("```json\n{valid}\n```\n```json\n{valid}\n```"),
        ] {
            assert!(parse_and_validate(&rejected).is_err());
        }

        let invalid = json!({
            "operation": "create",
            "expected_revision": null,
            "outline": {"slides": [{"page_number": 2, "contents": {}}]}
        });
        assert!(parse_and_validate(&format!("```json\n{invalid}\n```")).is_err());
        assert!(parse_and_validate(&invalid.to_string()).is_err());
    }
