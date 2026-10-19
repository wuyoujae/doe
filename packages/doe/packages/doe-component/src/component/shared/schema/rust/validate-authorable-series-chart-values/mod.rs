// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_series_chart_values
use crate::schema::*;


pub fn validate_authorable_series_chart_values(
    component_type: &str,
    props: &Map<String, Value>,
    path: &str,
) -> Result<(), String> {
    validate_authorable_optional_bool(props, "showLegend", path)?;
    if component_type == "line-chart" {
        validate_authorable_optional_bool(props, "smooth", path)?;
    } else {
        validate_authorable_optional_text(props, "subtitle", path)?;
    }

    let content = content_object(props, path)?;
    let content_path = format!("{path}.content");
    validate_authorable_optional_text(content, "valuePrefix", &content_path)?;
    validate_authorable_optional_text(content, "valueSuffix", &content_path)?;
    validate_authorable_optional_number(content, "maxValue", &content_path)?;
    if component_type == "line-chart" {
        validate_authorable_optional_bool(content, "includeZero", &content_path)?;
        validate_authorable_optional_number(content, "minValue", &content_path)?;
    }
    validate_axis_cross_fields(content, &content_path)?;

    let categories = content["categories"]
        .as_array()
        .expect("validated chart categories")
        .len();
    let series = content["series"]
        .as_array()
        .expect("validated chart series");
    if series.len() > 100 {
        return mismatch(format!(
            "{content_path}.series must contain at most 100 items"
        ));
    }
    for (series_index, series) in series.iter().enumerate() {
        let series_path = format!("{content_path}.series[{series_index}]");
        let series = object(series, &series_path)?;
        for (value_index, value) in series["data"]
            .as_array()
            .expect("validated chart data")
            .iter()
            .enumerate()
        {
            let value_path = format!("{series_path}.data[{value_index}]");
            let value = finite_number(value, &value_path)?;
            if matches!(component_type, "grouped-bar-chart" | "stacked-bar-chart") && value < 0.0 {
                return mismatch(format!("{value_path} must be non-negative"));
            }
        }
        if component_type == "line-chart" {
            if let Some(labels) = series.get("labels") {
                for (label_index, label) in array(labels, &format!("{series_path}.labels"))?
                    .iter()
                    .enumerate()
                {
                    let label_path = format!("{series_path}.labels[{label_index}]");
                    let label = object(label, &label_path)?;
                    validate_bounded_index(
                        required(label, "index", &label_path)?,
                        &format!("{label_path}.index"),
                        categories,
                    )?;
                    validate_authorable_optional_string_or_number(label, "text", &label_path)?;
                }
            }
        }
    }
    if component_type == "stacked-bar-chart" {
        for key in ["showYAxis", "showValues", "legendReversed"] {
            validate_authorable_optional_bool(content, key, &content_path)?;
        }
        if let Some(annotation) = content.get("annotation") {
            let annotation_path = format!("{content_path}.annotation");
            let annotation = object(annotation, &annotation_path)?;
            required_text(annotation, "label", &annotation_path)?;
            for key in ["from", "to"] {
                if let Some(index) = annotation.get(key) {
                    validate_bounded_index(index, &format!("{annotation_path}.{key}"), categories)?;
                }
            }
        }
    }
    Ok(())
}
