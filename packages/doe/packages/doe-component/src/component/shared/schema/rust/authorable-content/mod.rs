// Origin: app/backend/core/src/slide_agent_output_contract.rs::authorable_content
use crate::schema::*;


pub fn authorable_content<'a>(
    props: &'a Map<String, Value>,
    path: &str,
    props_keys: &[&str],
    content_keys: &[&str],
) -> Result<&'a Map<String, Value>, String> {
    allowed_keys(props, props_keys, path)?;
    if props_keys.contains(&"tooltip") { validate_tooltip(props, path)?; }
    let content = content_object(props, path)?;
    allowed_keys(content, content_keys, &format!("{path}.content"))?;
    Ok(content)
}

fn validate_tooltip(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    let Some(value) = props.get("tooltip") else { return Ok(()); };
    let at = format!("{path}.tooltip");
    let tooltip = object(value, &at)?;
    allowed_keys(tooltip, &["enabled", "metrics"], &at)?;
    if tooltip.get("enabled").is_some_and(|v| !v.is_boolean()) { return mismatch(format!("{at}.enabled must be boolean")); }
    if let Some(value) = tooltip.get("metrics") {
        let metrics = value.as_array().ok_or_else(|| format!("{at}.metrics must be an array"))?;
        if metrics.len() > 6 { return mismatch(format!("{at}.metrics allows at most 6 entries")); }
        for (index, value) in metrics.iter().enumerate() {
            let at = format!("{at}.metrics[{index}]");
            let metric = object(value, &at)?;
            allowed_keys(metric, &["label", "formula", "format", "decimals"], &at)?;
            for (key, max) in [("label", 80), ("formula", 256)] {
                if !metric.get(key).and_then(Value::as_str).is_some_and(|s| !s.trim().is_empty() && s.chars().count() <= max) { return mismatch(format!("{at}.{key} requires 1–{max} characters")); }
            }
            if !matches!(metric.get("format").and_then(Value::as_str), Some("number" | "percent")) { return mismatch(format!("{at}.format must be number or percent")); }
            if metric.get("decimals").is_some_and(|v| !v.as_u64().is_some_and(|v| v <= 6)) { return mismatch(format!("{at}.decimals must be an integer from 0 to 6")); }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tooltip_tests {
    use super::*;
    #[test]
    fn optional_metrics_accept_and_reject_invalid_shapes() {
        let valid = serde_json::json!({"tooltip":{"enabled":true,"metrics":[{"label":"Average","formula":"AVG(SERIES)","format":"number","decimals":2}]}});
        assert!(validate_tooltip(valid.as_object().unwrap(), "props").is_ok());
        for bad in [serde_json::json!({"enabled":"yes"}),serde_json::json!({"metrics":[{"label":"x","formula":"VALUE","format":"percent","decimals":7}]}),serde_json::json!({"metrics":[{"formula":"VALUE"}]})] {
            let props=serde_json::json!({"tooltip":bad});
            assert!(validate_tooltip(props.as_object().unwrap(), "props").is_err());
        }
    }
}
