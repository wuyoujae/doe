// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_radar_chart
use crate::schema::*;


pub fn validate_radar_chart(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    let content = content_object(props, path)?;
    let content_path = format!("{path}.content");
    let axes = array(
        required(content, "axes", &content_path)?,
        &format!("{content_path}.axes"),
    )?;
    if !(3..=8).contains(&axes.len()) {
        return mismatch(format!("{content_path}.axes must contain 3 to 8 axes"));
    }
    let datasets = array(
        required(content, "datasets", &content_path)?,
        &format!("{content_path}.datasets"),
    )?;
    if !(1..=3).contains(&datasets.len()) {
        return mismatch(format!(
            "{content_path}.datasets must contain 1 to 3 datasets"
        ));
    }
    for (index, dataset) in datasets.iter().enumerate() {
        let item_path = format!("{content_path}.datasets[{index}]");
        let dataset = object(dataset, &item_path)?;
        required_text(dataset, "name", &item_path)?;
        let values = array(
            required(dataset, "values", &item_path)?,
            &format!("{item_path}.values"),
        )?;
        if values.len() != axes.len() || values.iter().any(|value| !value.is_number()) {
            return mismatch(format!("{item_path}.values must match the axis count"));
        }
    }
    Ok(())
}
