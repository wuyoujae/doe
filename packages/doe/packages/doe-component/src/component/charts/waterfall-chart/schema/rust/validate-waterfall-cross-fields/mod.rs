// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_waterfall_cross_fields
use crate::schema::*;


pub fn validate_waterfall_cross_fields(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    let content = content_object(props, path)?;
    let content_path = format!("{path}.content");
    validate_axis_cross_fields(content, &content_path)?;
    let item_count = content["items"].as_array().expect("validated items").len();
    if let Some(callouts) = content.get("callouts") {
        for (index, callout) in array(callouts, &format!("{content_path}.callouts"))?
            .iter()
            .enumerate()
        {
            let callout_path = format!("{content_path}.callouts[{index}]");
            let callout = object(callout, &callout_path)?;
            validate_bounded_index(
                required(callout, "index", &callout_path)?,
                &format!("{callout_path}.index"),
                item_count,
            )?;
            required_text(callout, "text", &callout_path)?;
        }
    }
    if let Some(comparisons) = content.get("comparisons") {
        for (index, comparison) in array(comparisons, &format!("{content_path}.comparisons"))?
            .iter()
            .enumerate()
        {
            let comparison_path = format!("{content_path}.comparisons[{index}]");
            let comparison = object(comparison, &comparison_path)?;
            for key in ["from", "to"] {
                validate_bounded_index(
                    required(comparison, key, &comparison_path)?,
                    &format!("{comparison_path}.{key}"),
                    item_count,
                )?;
            }
            required_text(comparison, "label", &comparison_path)?;
        }
    }
    Ok(())
}
