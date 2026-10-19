// Origin: app/backend/core/src/slide_recovery/model_io.rs::exact_object
use super::*;


pub(super) fn exact_object<'a>(
    value: &'a Value,
    allowed: &[&str],
    label: &str,
) -> Result<&'a Map<String, Value>, String> {
    let object = value
        .as_object()
        .ok_or_else(|| format!("slide_recovery_model_output_{label}_type"))?;
    if object.len() != allowed.len()
        || object.keys().any(|key| !allowed.contains(&key.as_str()))
        || allowed.iter().any(|key| !object.contains_key(*key))
    {
        return Err(format!("slide_recovery_model_output_{label}_shape"));
    }
    Ok(object)
}
