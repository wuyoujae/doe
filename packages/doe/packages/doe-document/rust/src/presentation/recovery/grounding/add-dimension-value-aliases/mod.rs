// Origin: app/backend/core/src/slide_recovery/grounding.rs::add_dimension_value_aliases
use super::*;


pub(super) fn add_dimension_value_aliases(object: &serde_json::Map<String, Value>, output: &mut GuardedFacts) {
    let Some(dimensions) = object.get("dimensions").and_then(Value::as_array) else {
        return;
    };
    let Some(items) = object.get("items").and_then(Value::as_array) else {
        return;
    };
    let units = dimensions
        .iter()
        .map(|dimension| dimension.as_str().and_then(currency_unit))
        .collect::<Vec<_>>();
    for item in items {
        let Some(values) = item.get("values").and_then(Value::as_array) else {
            continue;
        };
        for (value, unit) in values.iter().zip(&units) {
            if let (Some(number), Some(unit)) = (number_value(value), *unit) {
                add_unit_number_aliases(&number, unit, output);
            }
        }
    }
}
