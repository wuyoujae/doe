// Origin: app/backend/core/src/slide_recovery/grounding.rs::is_outline_control_key


pub(crate) fn is_outline_control_key(key: &str) -> bool {
    matches!(
        key,
        "type"
            | "src"
            | "ratio"
            | "role"
            | "design"
            | "layout"
            | "style"
            | "color"
            | "background"
            | "icon"
    )
}
