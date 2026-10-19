// Origin: app/backend/core/src/slide_recovery/grounding.rs::currency_unit


pub(super) fn currency_unit(value: &str) -> Option<&'static str> {
    if value.contains("亿元") {
        Some("亿元")
    } else if value.contains("万元") {
        Some("万元")
    } else if value.contains('元') {
        Some("元")
    } else {
        None
    }
}
