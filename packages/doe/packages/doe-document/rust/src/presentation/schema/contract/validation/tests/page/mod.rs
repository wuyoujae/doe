// Origin: app/backend/core/src/slide_agent_output_contract/validation/tests.rs::page
use super::*;


pub(super) fn page(name: &str) -> Value {
    cases()["cases"]
        .as_array()
        .unwrap()
        .iter()
        .find(|case| case["name"] == name)
        .unwrap()["root"]["deck"]["slides"][0]
        .clone()
}
