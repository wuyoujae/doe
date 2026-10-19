// Origin: app/backend/core/src/plugin_slide_markdown.rs::first_heading
use super::*;


pub(super) fn first_heading(nodes: &[Value]) -> Option<&str> {
    nodes.iter().find_map(|node| match node["type"].as_str() {
        Some("hero") => node["props"]["title"].as_str(),
        Some("heading") => node["props"]["text"].as_str(),
        Some("layout-group") => node["children"]
            .as_array()
            .and_then(|children| first_heading(children)),
        _ => None,
    })
}
