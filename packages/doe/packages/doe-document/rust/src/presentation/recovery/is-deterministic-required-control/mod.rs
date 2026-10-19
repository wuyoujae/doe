// Origin: app/backend/core/src/slide_recovery/mod.rs::is_deterministic_required_control


pub(super) fn is_deterministic_required_control(path: &str) -> bool {
    path == "root.version"
        || path.ends_with(".size")
        || (path.ends_with(".layout") && path.contains(".blocks"))
}
