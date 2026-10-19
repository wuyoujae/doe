// Origin: app/backend/core/src/slide_recovery/tests.rs::contract_derived_mutation_corpus_covers_every_component_and_layout_group
use super::*;


#[test]
pub(super) fn contract_derived_mutation_corpus_covers_every_component_and_layout_group() {
    let allowed = vec!["https://images.example.com/contract-fixture.png".to_string()];
    for component_type in slide_agent_output_contract::component_types() {
        let props_schema =
            slide_agent_output_contract::component_props_response_schema(component_type);
        let props = contract_sample(&props_schema, Some("props"));
        let component = json!({
            "id": format!("{component_type}-fixture"),
            "type": component_type,
            "props": props,
        });
        let valid = deck(vec![json!({
            "id": "slide-1",
            "size": {"width": 960, "height": 540, "unit": "pt"},
            "blocks": [component]
        })]);
        recover_agent_deck(&valid.to_string(), expectations(1), &allowed)
            .unwrap_or_else(|error| panic!("{component_type} valid fixture failed: {error}"));

        for required in props_schema
            .get("required")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
        {
            let mut mutation = valid.clone();
            mutation["deck"]["slides"][0]["blocks"][0]["props"]
                .as_object_mut()
                .unwrap()
                .remove(required);
            let plan = plan_page_repairs(&mutation.to_string(), expectations(1), &allowed)
                .unwrap_or_else(|error| {
                    panic!("{component_type}.{required} deletion was not isolated: {error}")
                });
            assert_eq!(plan.targets[0].page_index, 0);
        }

        let mut unknown = valid.clone();
        unknown["deck"]["slides"][0]["blocks"][0]["props"]["unknownBusinessFact"] =
            json!("must not disappear");
        let unknown = recover_agent_deck(&unknown.to_string(), expectations(1), &allowed)
            .unwrap_or_else(|error| {
                panic!("{component_type} extensible prop candidate was corrupted: {error}")
            });
        assert_eq!(
            unknown.proof.disposition,
            SlideRecoveryDisposition::Original
        );

        let mut wrong_type = valid.clone();
        wrong_type["deck"]["slides"][0]["blocks"][0]["type"] = json!("unknown-component");
        plan_page_repairs(&wrong_type.to_string(), expectations(1), &allowed).unwrap_or_else(
            |error| panic!("{component_type} discriminator mutation was not isolated: {error}"),
        );

        let mut cardinality = valid.clone();
        if break_first_bounded_array(
            &mut cardinality["deck"]["slides"][0]["blocks"][0]["props"],
            &props_schema,
        ) {
            plan_page_repairs(&cardinality.to_string(), expectations(1), &allowed).unwrap_or_else(
                |error| panic!("{component_type} cardinality mutation was not isolated: {error}"),
            );
        }
    }

    let group = json!({
        "id": "group",
        "type": "layout-group",
        "kind": "container",
        "layout": {},
        "children": [{"id": "heading", "type": "heading", "props": {"text": "Group"}}]
    });
    let valid_group_deck = deck(vec![json!({
        "id": "slide-1",
        "size": {"width": 960, "height": 540, "unit": "pt"},
        "blocks": [group]
    })]);
    recover_agent_deck(&valid_group_deck.to_string(), expectations(1), &[]).unwrap();
    let mut missing_children = valid_group_deck.clone();
    missing_children["deck"]["slides"][0]["blocks"][0]
        .as_object_mut()
        .unwrap()
        .remove("children");
    assert!(plan_page_repairs(&missing_children.to_string(), expectations(1), &[]).is_ok());
}
