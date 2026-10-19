// Origin: app/backend/core/src/plugin_slide_markdown/tests.rs::output
use super::*;


pub(super) fn output(nodes: Vec<Value>) -> String {
    render("项目", &page(nodes), 2, 12, &["private-slide"]).unwrap()
}
