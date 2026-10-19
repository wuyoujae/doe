// Origin: app/backend/core/src/slide_recovery/mod.rs::textual_collection_contract


pub(super) fn textual_collection_contract(component_type: &str) -> Option<(&'static str, usize)> {
    match component_type {
        "capability-cards" | "numbered-icon-cards" => Some(("items", 6)),

        _ => None,
    }
}
