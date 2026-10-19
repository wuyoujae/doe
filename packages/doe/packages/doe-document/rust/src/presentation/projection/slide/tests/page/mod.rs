// Origin: app/backend/core/src/plugin_slide_markdown/tests.rs::page
use super::*;


pub(super) fn page(nodes: Vec<Value>) -> Value {
    json!({"id":"private-slide","blocks":nodes})
}
