// Origin: app/backend/core/src/outline_recovery/snapshot.rs::compile_factual_claim_policy
use super::*;


pub fn compile_factual_claim_policy(request: &str) -> &'static str {
    const SYNTHETIC_MARKERS: [&str; 9] = [
        "mock数据",
        "mock data",
        "模拟数据",
        "示例数据",
        "样例数据",
        "虚构数据",
        "假数据",
        "synthetic data",
        "dummy data",
    ];
    const NEGATION_MARKERS: [&str; 8] = [
        "不要",
        "禁止",
        "不得",
        "不能",
        "不使用",
        "do not",
        "must not",
        "without",
    ];
    let explicitly_allowed = clause_spans(request).into_iter().any(|(start, end)| {
        let clause = request[start..end].trim().to_lowercase();
        SYNTHETIC_MARKERS
            .iter()
            .any(|marker| clause.contains(marker))
            && !NEGATION_MARKERS
                .iter()
                .any(|marker| clause.contains(marker))
    });
    if explicitly_allowed {
        FACTUAL_POLICY_SYNTHETIC_ALLOWED
    } else {
        FACTUAL_POLICY_GROUNDED
    }
}
