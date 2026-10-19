// Component contract from validate_authorable_component_shape: "grouped-bar-chart"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_grouped_bar_chart(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            let content = authorable_content(
                props,
                path,
                &["tooltip", "content", "subtitle", "showLegend"],
                &[
                    "categories",
                    "series",
                    "valuePrefix",
                    "valueSuffix",
                    "maxValue",
                    "tickInterval",
                ],
            )?;
            validate_authorable_object_items(
                content,
                "series",
                &format!("{path}.content"),
                &["name", "data"],
            )
        }
}
