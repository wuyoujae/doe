// Component contract from validate_authorable_component_shape: "line-chart"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_line_chart(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            let content = authorable_content(
                props,
                path,
                &["tooltip", "content", "showLegend", "smooth"],
                &[
                    "categories",
                    "series",
                    "valuePrefix",
                    "valueSuffix",
                    "includeZero",
                    "minValue",
                    "maxValue",
                    "tickInterval",
                ],
            )?;
            let content_path = format!("{path}.content");
            validate_authorable_object_items(
                content,
                "series",
                &content_path,
                &["name", "data", "labels"],
            )?;
            for (index, series) in content["series"]
                .as_array()
                .expect("validated Line series")
                .iter()
                .enumerate()
            {
                validate_authorable_object_items(
                    object(series, &format!("{content_path}.series[{index}]"))?,
                    "labels",
                    &format!("{content_path}.series[{index}]"),
                    &["index", "text"],
                )?;
            }
            Ok(())
        }
}
