// Origin: app/backend/core/src/slide_recovery/grounding.rs::has_synthetic_label
use super::*;


pub(super) fn has_synthetic_label(facts: &GuardedFacts) -> bool {
    const LABELS: [&str; 8] = [
        "mock数据",
        "mockdata",
        "模拟数据",
        "示例数据",
        "样例数据",
        "虚构数据",
        "syntheticdata",
        "dummydata",
    ];
    facts
        .strings
        .iter()
        .any(|value| LABELS.iter().any(|label| value.contains(label)))
}
