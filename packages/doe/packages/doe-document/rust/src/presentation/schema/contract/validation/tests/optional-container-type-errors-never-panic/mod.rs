// Origin: app/backend/core/src/slide_agent_output_contract/validation/tests.rs::optional_container_type_errors_never_panic
use super::*;


#[test]
pub(super) fn optional_container_type_errors_never_panic() {
    fn paths(value: &Value, path: String, output: &mut Vec<String>) {
        match value {
            Value::Object(fields) => {
                output.push(path.clone());
                for (key, value) in fields {
                    paths(value, format!("{path}/{key}"), output);
                }
            }
            Value::Array(items) => {
                output.push(path.clone());
                for (index, value) in items.iter().enumerate() {
                    paths(value, format!("{path}/{index}"), output);
                }
            }
            _ => {}
        }
    }
    for case in cases()["cases"].as_array().unwrap() {
        let source = &case["root"]["deck"]["slides"][0];
        for (index, node) in source["blocks"].as_array().unwrap().iter().enumerate() {
            if node["type"] == "layout-group" {
                continue;
            }
            let mut locations = vec![];
            paths(
                &node["props"],
                format!("/blocks/{index}/props"),
                &mut locations,
            );
            for pointer in locations {
                // Some fields intentionally accept multiple types (table cells,
                // semanticWrap, donut titles). Check totality, not rejection of
                // a legal alternative, while dedicated cases assert failures.
                for replacement in [
                    Value::Null,
                    json!(false),
                    json!(1),
                    json!("serialized"),
                    json!([]),
                    json!({}),
                ] {
                    let mut slide = source.clone();
                    *slide.pointer_mut(&pointer).unwrap() = replacement;
                    assert!(
                        std::panic::catch_unwind(|| validate_slide(&slide)).is_ok(),
                        "{}: {pointer}",
                        case["name"]
                    );
                }
            }
        }
    }
}
