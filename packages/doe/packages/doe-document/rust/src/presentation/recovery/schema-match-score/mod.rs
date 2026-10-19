// Origin: app/backend/core/src/slide_recovery/mod.rs::schema_match_score
use super::*;


pub(super) fn schema_match_score(schema: &Value, value: &Value) -> Option<usize> {
    if let Some(branch) = select_schema_branch(schema, value) {
        return schema_match_score(branch, value).map(|score| score + 1);
    }
    if !schema_type_matches(schema, value) {
        return None;
    }
    let discriminator = schema
        .get("properties")
        .and_then(|properties| properties.get("type"))
        .and_then(|schema| schema.get("enum"))
        .and_then(Value::as_array);
    match discriminator {
        Some(allowed) => {
            let actual = value.get("type")?;
            allowed.contains(actual).then_some(100)
        }
        None => Some(1),
    }
}
