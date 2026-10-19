// Origin: app/backend/core/src/slide_agent_output_contract/validation/tests.rs::invalid_components_values_and_relations_are_rejected
use super::*;


#[test]
pub(super) fn invalid_components_values_and_relations_are_rejected() {
    for (name, pointer, replacement) in [
        ("heading", "/blocks/0/props/level", json!(7)),
        (
            "todo-list",
            "/blocks/0/props/items/0/checked",
            json!("false"),
        ),
        (
            "grouped-bar-chart",
            "/blocks/0/props/content/series/0/data",
            json!([1]),
        ),
        (
            "radar-chart",
            "/blocks/0/props/content/datasets/0/values/0",
            json!(-1),
        ),
        (
            "numbered-icon-cards",
            "/blocks/0/props/content/items",
            json!([]),
        ),
        ("text", "/blocks/0/type", json!("invented-widget")),
    ] {
        let mut slide = page(name);
        *slide.pointer_mut(pointer).unwrap() = replacement;
        assert!(validate_slide(&slide).is_err(), "{name}: {pointer}");
    }
}
