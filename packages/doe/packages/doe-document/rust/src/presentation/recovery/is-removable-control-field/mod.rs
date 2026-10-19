// Origin: app/backend/core/src/slide_recovery/mod.rs::is_removable_control_field


pub(super) fn is_removable_control_field(key: &str) -> bool {
    matches!(key, "kind" | "theme" | "editor")
}
