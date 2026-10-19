// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_risk_priority_zone
use crate::schema::*;


pub fn validate_risk_priority_zone(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    let content = content_object(props, path)?;
    let Some(zone) = content.get("priorityZone") else {
        return Ok(());
    };
    let zone_path = format!("{path}.content.priorityZone");
    let zone = object(zone, &zone_path)?;
    let coordinate = |key: &str| {
        finite_number(
            required(zone, key, &zone_path)?,
            &format!("{zone_path}.{key}"),
        )
    };
    let x = coordinate("x")?;
    let y = coordinate("y")?;
    let width = coordinate("width")?;
    let height = coordinate("height")?;
    for (key, value) in [("x", x), ("y", y), ("width", width), ("height", height)] {
        if !(0.0..=1.0).contains(&value) {
            return mismatch(format!("{zone_path}.{key} must be between 0 and 1"));
        }
    }
    if x + width > 1.0 || y + height > 1.0 {
        return mismatch(format!("{zone_path} must stay inside the normalized plot"));
    }
    Ok(())
}
