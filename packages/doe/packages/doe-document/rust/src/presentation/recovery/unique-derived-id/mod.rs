// Origin: app/backend/core/src/slide_recovery/mod.rs::unique_derived_id
use super::*;


pub(super) fn unique_derived_id(node_id: &str, label: &str, ids: &mut BTreeSet<String>) -> String {
    let base = format!(
        "{}-{label}",
        node_id
            .chars()
            .take(112usize.saturating_sub(label.chars().count()))
            .collect::<String>()
    );
    if ids.insert(base.clone()) {
        return base;
    }
    for suffix in 2..=999 {
        let candidate = format!("{}-{suffix}", base.chars().take(120).collect::<String>());
        if ids.insert(candidate.clone()) {
            return candidate;
        }
    }
    format!("{label}-{}", ids.len())
}
