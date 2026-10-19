// Origin: app/backend/core/src/slide_recovery/grounding.rs::add_unit_number_aliases
use super::*;


pub(super) fn add_unit_number_aliases(number: &str, unit: &str, output: &mut GuardedFacts) {
    let Some(source_power) = (match unit {
        "元" => Some(0),
        "万元" => Some(4),
        "亿元" => Some(8),
        _ => None,
    }) else {
        return;
    };
    let Some(base) = scale_decimal(number, source_power) else {
        return;
    };
    for target_power in [0, 4, 8] {
        if let Some(alias) = scale_decimal(&base, -target_power) {
            output.numbers.insert(alias);
        }
    }
}
