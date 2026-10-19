// Component contract from validate_authorable_component_shape: "stacked-bar-chart"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_stacked_bar_chart(props: &Map<String, Value>, path: &str) -> Result<(), String> {
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
                    "showYAxis",
                    "showValues",
                    "legendReversed",
                    "annotation",
                ],
            )?;
            validate_authorable_object_items(
                content,
                "series",
                &format!("{path}.content"),
                &["name", "data"],
            )?;
            validate_authorable_optional_object(
                content,
                "annotation",
                &format!("{path}.content"),
                &["label", "from", "to"],
            )
        }
}
