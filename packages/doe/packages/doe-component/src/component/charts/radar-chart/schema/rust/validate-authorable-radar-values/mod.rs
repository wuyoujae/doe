// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_radar_values
use crate::schema::*;


pub fn validate_authorable_radar_values(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_authorable_optional_text(props, "subtitle", path)?;
    validate_authorable_optional_bool(props, "showLegend", path)?;
    let content = content_object(props, path)?;
    let content_path = format!("{path}.content");
    let axes = content["axes"].as_array().expect("validated Radar axes");
    let mut maxima = Vec::with_capacity(axes.len());
    for (index, axis) in axes.iter().enumerate() {
        let axis_path = format!("{content_path}.axes[{index}]");
        let axis = object(axis, &axis_path)?;
        required_text(axis, "label", &axis_path)?;
        let maximum = finite_number(
            required(axis, "max", &axis_path)?,
            &format!("{axis_path}.max"),
        )?;
        if maximum <= 0.0 {
            return mismatch(format!("{axis_path}.max must be greater than 0"));
        }
        maxima.push(maximum);
    }
    for (dataset_index, dataset) in content["datasets"]
        .as_array()
        .expect("validated Radar datasets")
        .iter()
        .enumerate()
    {
        let dataset_path = format!("{content_path}.datasets[{dataset_index}]");
        let dataset = object(dataset, &dataset_path)?;
        for (value_index, value) in dataset["values"]
            .as_array()
            .expect("validated Radar values")
            .iter()
            .enumerate()
        {
            let value_path = format!("{dataset_path}.values[{value_index}]");
            let value = finite_number(value, &value_path)?;
            if !(0.0..=maxima[value_index]).contains(&value) {
                return mismatch(format!(
                    "{value_path} must be between 0 and its axis maximum"
                ));
            }
        }
    }
    Ok(())
}
