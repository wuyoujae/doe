// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_risk_values
use crate::schema::*;


pub fn validate_authorable_risk_values(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_authorable_optional_text(props, "subtitle", path)?;
    let content = content_object(props, path)?;
    let content_path = format!("{path}.content");
    for key in ["xLabel", "yLabel"] {
        validate_authorable_optional_text(content, key, &content_path)?;
    }
    for (index, item) in content["items"]
        .as_array()
        .expect("validated Risk items")
        .iter()
        .enumerate()
    {
        let item_path = format!("{content_path}.items[{index}]");
        let item = object(item, &item_path)?;
        for key in ["x", "y"] {
            let coordinate = finite_number(
                required(item, key, &item_path)?,
                &format!("{item_path}.{key}"),
            )?;
            if !(0.0..=1.0).contains(&coordinate) {
                return mismatch(format!("{item_path}.{key} must be between 0 and 1"));
            }
        }
    }
    if let Some(zone) = content.get("priorityZone") {
        let zone_path = format!("{content_path}.priorityZone");
        let zone = object(zone, &zone_path)?;
        for key in ["x", "y", "width", "height"] {
            required(zone, key, &zone_path)?;
        }
        validate_authorable_optional_text(zone, "label", &zone_path)?;
        validate_authorable_optional_string_array(zone, "labelLines", &zone_path)?;
    }
    validate_risk_priority_zone(props, path)
}
