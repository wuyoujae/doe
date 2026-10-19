// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_series_chart
use crate::schema::*;


pub fn validate_series_chart(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    let content = content_object(props, path)?;
    let content_path = format!("{path}.content");
    let categories = string_array(
        required(content, "categories", &content_path)?,
        &format!("{content_path}.categories"),
        1,
        100,
    )?;
    let series = array(
        required(content, "series", &content_path)?,
        &format!("{content_path}.series"),
    )?;
    if series.is_empty() {
        return mismatch(format!("{content_path}.series must not be empty"));
    }
    for (index, item) in series.iter().enumerate() {
        let item_path = format!("{content_path}.series[{index}]");
        let item = object(item, &item_path)?;
        required_text(item, "name", &item_path)?;
        let data = array(
            required(item, "data", &item_path)?,
            &format!("{item_path}.data"),
        )?;
        if data.len() != categories {
            return mismatch(format!("{item_path}.data must match the category count"));
        }
        for (value_index, value) in data.iter().enumerate() {
            number(value, &format!("{item_path}.data[{value_index}]"))?;
        }
    }
    Ok(())
}
