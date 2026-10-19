// Origin: app/backend/core/src/plugin_slide_markdown/tests.rs::node
use super::*;


pub(super) fn node(kind: &str, props: Value) -> Value {
    json!({"id":"private-node","type":kind,"props":props})
}
