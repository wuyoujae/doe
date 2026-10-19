// Origin: app/backend/core/src/slide_recovery/grounding.rs::add_series_data_unit_aliases
use super::*;


pub(super) fn add_series_data_unit_aliases(
    object: &serde_json::Map<String, Value>,
    output: &mut GuardedFacts,
) {
    let Some(series) = object.get("series").and_then(Value::as_array) else {
        return;
    };
    for item in series {
        let Some(unit) = item
            .get("name")
            .and_then(Value::as_str)
            .and_then(currency_unit)
        else {
            continue;
        };
        let Some(data) = item.get("data").and_then(Value::as_array) else {
            continue;
        };
        for value in data {
            if let Some(number) = number_value(value) {
                add_unit_number_aliases(&number, unit, output);
            }
        }
    }
}
