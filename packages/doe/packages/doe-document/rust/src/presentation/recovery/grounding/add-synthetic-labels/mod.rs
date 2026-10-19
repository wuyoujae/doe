// Origin: app/backend/core/src/slide_recovery/grounding.rs::add_synthetic_labels
use super::*;


pub(super) fn add_synthetic_labels(strings: &mut BTreeSet<String>) {
    for label in [
        "Mock data",
        "模拟数据",
        "示例数据",
        "样例数据",
        "Synthetic data",
    ] {
        strings.insert(normalize(label));
    }
}
