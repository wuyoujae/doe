// Component contract from validate_authorable_component_shape: "waterfall-chart"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_waterfall_chart(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            let content = authorable_content(
                props,
                path,
                &["tooltip", "content", "subtitle"],
                &[
                    "items",
                    "valuePrefix",
                    "valueSuffix",
                    "includeZero",
                    "minValue",
                    "maxValue",
                    "tickInterval",
                    "showYAxis",
                    "showValues",
                    "showChangeSigns",
                    "staggerLabels",
                    "footnote",
                    "callouts",
                    "comparisons",
                ],
            )?;
            let content_path = format!("{path}.content");
            validate_authorable_object_items(
                content,
                "items",
                &content_path,
                &[
                    "label",
                    "value",
                    "type",
                    "connectToNext",
                    "showValue",
                    "valuePosition",
                ],
            )?;
            validate_authorable_object_items(
                content,
                "callouts",
                &content_path,
                &["index", "text", "position"],
            )?;
            validate_authorable_object_items(
                content,
                "comparisons",
                &content_path,
                &["from", "to", "label"],
            )
        }
}
