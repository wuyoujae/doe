// Origin: app/backend/core/src/slide_recovery/grounding.rs::add_value_unit_alias
use super::*;


pub(super) fn add_value_unit_alias(object: &serde_json::Map<String, Value>, output: &mut GuardedFacts) {
    let Some(value) = object.get("value") else {
        return;
    };
    let Some(unit) = object
        .get("unit")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|unit| !unit.is_empty())
    else {
        return;
    };
    let value = match value {
        Value::Number(value) => value.to_string(),
        Value::String(value) => value.trim().to_string(),
        _ => return,
    };
    for number in number_tokens(&value) {
        add_unit_number_aliases(&number, unit, output);
        for alias in number_tokens(&format!("{number}{unit}")) {
            output.numbers.insert(alias);
        }
    }
}
