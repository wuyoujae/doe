
    use super::*;

    fn valid_component(discriminator: &str) -> Value {
        match discriminator {
            "text_block" => json!({"type":"text_block","paragraphs":["A"]}),
            "metric" => json!({"type":"metric","label":"Revenue","value":42}),
            "metrics" => json!({"type":"metrics","items":[{"label":"Revenue","value":42}]}),
            "timeline" => {
                json!({"type":"timeline","events":[{"time":"2026","title":"Launch","detail":"Released"}]})
            }
            "process" => {
                json!({"type":"process","steps":[{"order":1,"title":"Start","detail":"Begin"}]})
            }
            "strengths" => {
                json!({"type":"strengths","items":[{"title":"Fast","text":"Low latency"}]})
            }
            "comparison" => {
                json!({"type":"comparison","dimensions":["Cost"],"items":[{"name":"A","values":[1]}]})
            }
            "table" => {
                json!({"type":"table","columns":[{"key":"cost","label":"Cost"}],"rows":[{"cost":1}]})
            }
            "illustrated_items" => json!({
                "type":"illustrated_items",
                "items":[
                    {"title":"A","text":"One","image":{"type":"image","src":"https://example.com/a.png","ratio":"1:1","role":"illustration"}},
                    {"title":"B","text":"Two","image":{"type":"generated_image","src":"GENRATEIMG(a blue sphere)","ratio":"1:1","role":"illustration"}}
                ]
            }),
            "image" => {
                json!({"type":"image","src":"https://example.com/a.png","ratio":"16:9","role":"hero"})
            }
            "generated_image" => {
                json!({"type":"generated_image","src":"GENRATEIMG(a blue sphere)","ratio":"16:9","role":"hero"})
            }
            _ => panic!("unknown component fixture"),
        }
    }

    fn outline_input(body: Value) -> crate::presentation::outline::input::OutlineInput {
        serde_json::from_value(json!({
            "slides": [{
                "page_number": 1,
                "contents": {"content": {"body": body, "describe": "render faithfully"}}
            }]
        }))
        .unwrap()
    }

    #[test]
    fn contract_graph_has_stable_unique_constraint_ids() {
        let graph = OutlineContractGraph::current();
        let mut ids = graph
            .constraints()
            .iter()
            .map(|constraint| constraint.id)
            .collect::<Vec<_>>();
        let original_len = ids.len();
        ids.sort_unstable();
        ids.dedup();
        assert_eq!(ids.len(), original_len);
        assert_eq!(
            graph.machine_contract()["contract_version"],
            graph.version()
        );
        assert_eq!(
            graph.provider_response_format(),
            json!({"type": "json_object"})
        );
        assert_eq!(
            graph.machine_contract()["provider_constraint"]["mode"],
            "json_object"
        );
        assert!(graph.fields().iter().any(|field| {
            field.path == "/outline/slides/*/contents/*/body/src"
                && field.class == FieldClass::Reference
        }));
        assert_eq!(graph.components().len(), 11);
        assert_eq!(
            graph.machine_contract()["limits"]["response_bytes"],
            MAX_OUTLINE_RESPONSE_BYTES
        );
        assert_eq!(
            graph.machine_contract()["limits"]["document_bytes"],
            MAX_OUTLINE_DOCUMENT_BYTES
        );
    }

    #[test]
    fn every_standard_component_is_validated_from_the_contract_graph() {
        let graph = OutlineContractGraph::current();
        for component in graph.components() {
            let body = valid_component(component.discriminator);
            graph
                .validate_canonical_outline(outline_input(body.clone()))
                .unwrap_or_else(|error| {
                    panic!("{} fixture failed: {error}", component.discriminator)
                });

            let mut missing = body.as_object().unwrap().clone();
            missing.remove(*component.required_fields.last().unwrap());
            assert!(
                graph
                    .validate_canonical_outline(outline_input(Value::Object(missing)))
                    .is_err(),
                "{} accepted a missing required field",
                component.discriminator
            );

            let mut additional = body.as_object().unwrap().clone();
            additional.insert("unexpected".to_string(), Value::Bool(true));
            assert!(
                graph
                    .validate_canonical_outline(outline_input(Value::Object(additional)))
                    .is_err(),
                "{} accepted an undeclared standard-component field",
                component.discriminator
            );
        }
    }

    #[test]
    fn runtime_outline_parser_and_contract_graph_accept_the_same_standard_components() {
        let graph = OutlineContractGraph::current();
        for component in graph.components() {
            let body = valid_component(component.discriminator);
            graph
                .validate_canonical_outline(outline_input(body.clone()))
                .unwrap();
            let raw = serde_json::to_string(&json!({
                "operation": "create",
                "expected_revision": null,
                "outline": {
                    "slides": [{
                        "page_number": 1,
                        "contents": {"content": {"body": body, "describe": "render faithfully"}}
                    }]
                }
            }))
            .unwrap();
            crate::presentation::outline::authoring::parse_and_validate(&raw).unwrap_or_else(
                |error| {
                    panic!(
                        "runtime parser drifted for {}: {error}",
                        component.discriminator
                    )
                },
            );
        }
    }

    #[test]
    fn cross_field_and_security_constraints_are_hard_failures() {
        let graph = OutlineContractGraph::current();
        let mismatched_comparison = json!({
            "type":"comparison",
            "dimensions":["Cost", "Speed"],
            "items":[{"name":"A","values":[1]}]
        });
        assert!(graph
            .validate_canonical_outline(outline_input(mismatched_comparison))
            .is_err());

        let mismatched_table = json!({
            "type":"table",
            "columns":[{"key":"cost","label":"Cost"}],
            "rows":[{"other":1}]
        });
        assert!(graph
            .validate_canonical_outline(outline_input(mismatched_table))
            .is_err());

        let forbidden_custom = json!({"type":"custom_card","constructor":"payload"});
        assert!(graph
            .validate_canonical_outline(outline_input(forbidden_custom))
            .is_err());
    }
