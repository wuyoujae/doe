// Origin: app/backend/core/src/outline_agent_output_contract.rs::json_pointer_child


pub(super) fn json_pointer_child(parent: &str, key: &str) -> String {
    let escaped = key.replace('~', "~0").replace('/', "~1");
    format!("{parent}/{escaped}")
}
