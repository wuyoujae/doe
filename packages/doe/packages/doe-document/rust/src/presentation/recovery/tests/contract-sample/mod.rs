// Origin: app/backend/core/src/slide_recovery/tests.rs::contract_sample
use super::*;


pub(super) fn contract_sample(schema: &Value, key: Option<&str>) -> Value {
    if let Some(value) = schema
        .get("enum")
        .and_then(Value::as_array)
        .and_then(|values| values.first())
    {
        return value.clone();
    }
    if let Some(variants) = schema.get("anyOf").and_then(Value::as_array) {
        return contract_sample(&variants[0], key);
    }
    let schema_type = schema.get("type");
    if let Some(types) = schema_type.and_then(Value::as_array) {
        let selected = types
            .iter()
            .find(|value| value.as_str() != Some("null"))
            .cloned()
            .unwrap_or(Value::Null);
        let mut selected_schema = schema.clone();
        selected_schema["type"] = selected;
        return contract_sample(&selected_schema, key);
    }
    match schema_type.and_then(Value::as_str) {
        Some("object") | None if schema.get("properties").is_some() => {
            let properties = schema["properties"].as_object().unwrap();
            schema
                .get("required")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
                .filter_map(Value::as_str)
                .map(|property| {
                    (
                        property.to_string(),
                        contract_sample(&properties[property], Some(property)),
                    )
                })
                .collect::<Map<String, Value>>()
                .into()
        }
        Some("array") => {
            let count = schema
                .get("minItems")
                .and_then(Value::as_u64)
                .unwrap_or(1)
                .max(1) as usize;
            Value::Array(
                (0..count)
                    .map(|_| contract_sample(&schema["items"], key))
                    .collect(),
            )
        }
        Some("string") => Value::String(match key {
            Some("src") => "https://images.example.com/contract-fixture.png".to_string(),
            Some("formula") => "x = 1".to_string(),
            _ => "Contract fixture".to_string(),
        }),
        Some("integer") => Value::from(schema.get("minimum").and_then(Value::as_i64).unwrap_or(1)),
        Some("number") => {
            let minimum = schema.get("minimum").and_then(Value::as_f64).unwrap_or(1.0);
            let maximum = schema
                .get("maximum")
                .and_then(Value::as_f64)
                .unwrap_or(f64::INFINITY);
            Value::from(if minimum == 0.0 && maximum >= 1.0 {
                1.0
            } else {
                minimum
            })
        }
        Some("boolean") => Value::Bool(true),
        Some("null") => Value::Null,
        None => match key {
            Some("values" | "data") => Value::from(1),
            Some("axes") => Value::String("Axis".to_string()),
            Some("cells") => Value::String("Cell".to_string()),
            _ => Value::String("Contract fixture".to_string()),
        },
        other => panic!("unsupported contract fixture type: {other:?}"),
    }
}
